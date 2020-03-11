import { TranslatedText } from "@watchedcom/schema";
import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { cloneDeep, defaults } from "lodash";
import * as morgan from "morgan";
import * as path from "path";
import * as semver from "semver";
import { BasicAddonClass } from "./addons";
import {
  CacheFoundError,
  CacheHandler,
  DiskCache,
  MemoryCache,
  RedisCache
} from "./cache";
import { errorHandler } from "./error-handler";
import { RequestCacheFn } from "./interfaces";
import {
  createTaskFetch,
  createTaskRecaptcha,
  createTaskResponseHandler,
  Responder
} from "./tasks";
import { RecordData, RequestRecorder } from "./utils/request-recorder";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

export type ServeAddonsOptions = {
  /**
   * Start the server in single addon mode (default: true)
   */
  singleMode: boolean;
  /**
   * Log HTTP requests (default: true)
   */
  logRequests: boolean;
  /**
   * Write requests to the addon server to a file which can
   * be replayed later. This is very useful for testing or
   * to create test cases.
   */
  requestRecorderPath: null | string;
  /**
   * Express error handler
   */
  errorHandler: express.ErrorRequestHandler;
  /**
   * Listen port
   */
  port: number;
  /**
   * Cache handler
   */
  cache: CacheHandler;
};

const defaultServeOpts: ServeAddonsOptions = {
  singleMode: false,
  logRequests: true,
  requestRecorderPath: null,
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  cache: new CacheHandler(
    process.env.DISK_CACHE
      ? new DiskCache(process.env.DISK_CACHE)
      : process.env.REDIS_CACHE
      ? new RedisCache({ url: process.env.REDIS_CACHE })
      : new MemoryCache()
  )
};

let requestRecorder: RequestRecorder;

const createActionHandler = (
  addon: BasicAddonClass,
  cache: CacheHandler,
  requestRecorderPath: null | string
) => {
  try {
    addon.validateAddon();
  } catch (error) {
    throw new Error(
      `Validation of addon "${addon.getId()}" failed: ${error.message}`
    );
  }

  if (requestRecorderPath && !requestRecorder) {
    requestRecorder = new RequestRecorder(requestRecorderPath);
    console.warn(`Logging requests to ${requestRecorder.path}`);
  }

  const majorVersion = semver.parse(addon.getVersion())?.major;
  if (majorVersion === undefined) {
    throw new Error(
      `Failed getting major version from  "${addon.getVersion()}" of addon "${addon.getId()}"`
    );
  }

  const actionHandler: express.RequestHandler = async (req, res) => {
    const input =
      req.method === "POST"
        ? req.body
        : req.query.data
        ? JSON.parse(req.query.data)
        : {};

    const action = req.params[0];
    const handler = addon.getActionHandler(action);
    const validator = getActionValidator(action);
    validator.request(input);

    // Get sig contents
    let sig: string;
    if (input.sig) {
      // Legacy
      sig = input.sig;
      delete input.sig;
    } else {
      sig = <string>req.headers["watched-sig"] ?? "";
    }
    const sigData =
      process.env.SKIP_AUTH === "1" || action === "addon"
        ? null
        : validateSignature(sig);

    // Store request data for recording
    const record: Partial<RecordData> = {};
    if (requestRecorder) {
      record.addon = addon.getId();
      record.action = action;
      record.input = cloneDeep(input);
    }

    // Get a cache handler instance
    cache = cache.clone({
      prefix: [addon.getId(), majorVersion, action]
    });

    // Request cache helper
    let inlineCache: any = null;
    const requestCache: RequestCacheFn = async (key, options) => {
      if (inlineCache) throw new Error(`Request cache is already set up`);
      const c = cache.clone(options);
      inlineCache = await c.inline(key);
    };

    // Responder object
    const responder = new Responder(async (statusCode: number, body: any) => {
      res.status(statusCode).json(body);
    });

    // Handle the request
    let statusCode = 200;
    let result: any;
    try {
      result = await handler(
        input,
        {
          request: req,
          sig: sigData,
          cache,
          requestCache,
          fetch: createTaskFetch(responder, cache),
          recaptcha: createTaskRecaptcha(responder, cache)
        },
        addon
      );
      switch (action) {
        case "resolve":
        case "captcha":
          if (result === null) throw new Error("Nothing found");
          break;
      }
      validator.response(result);
      if (inlineCache) await inlineCache.set(result);
    } catch (error) {
      if (error instanceof CacheFoundError) {
        if (error.result !== undefined) {
          result = error.result;
        } else {
          statusCode = 500;
          result = { error: error.error };
        }
      } else {
        if (inlineCache) await inlineCache.setError(error);
        statusCode = 500;
        result = { error: error.message || error };
        console.warn(error);
      }
    }

    if (requestRecorder) {
      record.statusCode = statusCode;
      record.result = result;
      await requestRecorder.write(<RecordData>record);
    }

    responder.send(statusCode, result);
  };

  return actionHandler;
};

const createAddonRouter = (
  addon: BasicAddonClass,
  options: ServeAddonsOptions
) => {
  const router = express.Router();
  router.use(bodyParser.json({ limit: "10mb" }));
  router.get("/", async (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Got replaced by a GET /addon.watched call
      res.send({ watched: "addon" });
    } else if (options.singleMode) {
      // In single mode, render the index page
      // TODO: Get addon props from the action handler `addon`
      res.render("index", {
        addons: [addon.getProps()],
        options
      });
    } else {
      // Redirect to index page
      res.redirect("..");
    }
  });

  const actionHandler = createActionHandler(
    addon,
    options.cache,
    options.requestRecorderPath
  );
  const taskHandler = createTaskResponseHandler(addon, options.cache);

  router.get(/^\/([^/]*?)(?:-(task))?(?:\.watched)?$/, (req, res, next) => {
    if (req.params[1] === "task") taskHandler(req, res, next);
    else actionHandler(req, res, next);
  });
  router.post(/^\/([^/]*?)(?:-(task))?(?:\.watched)?$/, (req, res, next) => {
    if (req.params[1] === "task") taskHandler(req, res, next);
    else actionHandler(req, res, next);
  });

  return router;
};

export const createSingleAddonRouter = (
  addons: BasicAddonClass[],
  options: ServeAddonsOptions
) => {
  if (addons.length > 1) {
    throw new Error(
      `The single addon router only supports one addon at a time. ` +
        `You tried to start the server with ${addons.length} addons.`
    );
  }

  console.info(`Mounting addon ${addons[0].getId()} on /`);
  return createAddonRouter(addons[0], options);
};

export const createMultiAddonRouter = (
  addons: BasicAddonClass[],
  options: ServeAddonsOptions
) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Got replaced by a GET /addon.watched call
      // Send all addon id's
      res.send({
        watched: "index",
        addons: addons.map(addon => addon.getId())
      });
    } else {
      // TODO: Get get addon props from the action handler `addon`
      res.render("index", {
        addons: addons.map(addon => addon.getProps()),
        options
      });
    }
  });

  router.get("/addon.watched", (req, res) => {
    // New discovery which replaces wtchDiscover
    res.send({
      type: "server",
      addons: addons.map(addon => addon.getId())
    });
  });

  const ids = new Set();
  for (const addon of addons) {
    const id = addon.getId();
    if (ids.has(id)) throw new Error(`Addon ID "${id}" is already exists.`);
    ids.add(id);
    console.info(`Mounting addon ${id}`);
    router.use(`/${id}`, createAddonRouter(addon, options));
  }

  return router;
};

export const createApp = (
  addons: BasicAddonClass[],
  opts?: Partial<ServeAddonsOptions>
): express.Application => {
  const app = express();
  const options: ServeAddonsOptions = defaults(opts, defaultServeOpts);
  if (options.logRequests) app.use(morgan("dev"));

  app.set("port", options.port);
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "pug");

  app.locals.selectT = (s: TranslatedText) => {
    if (typeof s === "string") return s;
    if (typeof s !== "object") return JSON.stringify(s);
    // TODO: Detect browser language
    if (s.en) return s.en;
    const lng = Object.keys(s)[0];
    return s[lng];
  };

  if (options.singleMode) {
    app.use("/", createSingleAddonRouter(addons, options));
  } else {
    // Mount all addons on /<id>
    app.use("/", createMultiAddonRouter(addons, options));
  }

  app.get("/health", (req, res) => res.send("OK"));
  app.use(options.errorHandler);

  return app;
};

export const serveAddons = (
  addons: BasicAddonClass[],
  opts?: Partial<ServeAddonsOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
  const app = createApp(addons, opts);

  const listenPromise = new Promise<void>(resolve => {
    app.listen(app.get("port"), () => {
      console.info(`Listening on ${app.get("port")}`);
      resolve();
    });
  });

  return { app, listenPromise };
};
