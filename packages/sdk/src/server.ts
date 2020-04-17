import { TranslatedText } from "@watchedcom/schema";
import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { cloneDeep, defaults } from "lodash";
import * as morgan from "morgan";
import * as path from "path";
import { BasicAddonClass } from "./addons";
import {
  CacheFoundError,
  CacheHandler,
  DiskCache,
  MemoryCache,
  MongoCache,
  RedisCache,
} from "./cache";
import { errorHandler } from "./error-handler";
import { IServeAddonsOptions, RequestCacheFn } from "./interfaces";
import { migrations } from "./migrations";
import {
  createTaskFetch,
  createTaskRecaptcha,
  createTaskResponseHandler,
  Responder,
} from "./tasks";
import { RecordData, setupRequestRecorder } from "./utils/request-recorder";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

export class ServeAddonOptions implements Partial<IServeAddonsOptions> {
  constructor(props: Partial<IServeAddonsOptions>) {
    Object.assign(this, props);
  }
}

const defaultServeOpts: IServeAddonsOptions = {
  singleMode: false,
  logRequests: true,
  requestRecorderPath: null,
  replayMode: false,
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  cache: new CacheHandler(
    process.env.DISK_CACHE
      ? new DiskCache(process.env.DISK_CACHE)
      : process.env.REDIS_CACHE
      ? new RedisCache({ url: process.env.REDIS_CACHE })
      : process.env.MONGO_CACHE
      ? new MongoCache(process.env.MONGO_CACHE)
      : new MemoryCache()
  ),
  preMiddlewares: [],
  postMiddlewares: [],
};

/**
 * An error which will not log any backtrace.
 *
 * All errors with the property `noBacktraceLog` set to `true` will not show a
 * backtrace on the console.
 */
export class SilentError extends Error {
  public noBacktraceLog: boolean;

  constructor(message: any) {
    super(message);
    this.noBacktraceLog = true;
  }
}

const createActionHandler = (
  addon: BasicAddonClass,
  opts: IServeAddonsOptions
) => {
  try {
    addon.validateAddon();
  } catch (error) {
    throw new Error(
      `Validation of addon "${addon.getId()}" failed: ${error.message}`
    );
  }

  if (opts.requestRecorderPath) {
    setupRequestRecorder(opts.requestRecorderPath);
  }

  const actionHandler: express.RequestHandler = async (req, res) => {
    const action = req.params[0];
    let input =
      req.method === "POST"
        ? req.body
        : req.query.data
        ? JSON.parse(<string>req.query.data)
        : {};

    // Get action handler before verifying the signature
    const handler = addon.getActionHandler(action);

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

    const migrationCtx = {
      addon,
      data: {},
      sigData,
      validator: getActionValidator(addon.getType(), action),
    };
    if (migrations[action]?.request) {
      input = migrations[action].request(migrationCtx, input);
    } else {
      input = migrationCtx.validator.request(input);
    }

    // Get a cache handler instance
    const cache = opts.cache.clone({
      prefix: addon.getId(),
      ...addon.getDefaultCacheOptions(),
    });

    // Request cache helper
    let inlineCache: any = null;
    const requestCache: RequestCacheFn = async (key, options) => {
      if (inlineCache) throw new Error(`Request cache is already set up`);
      const c = cache.clone(options);
      inlineCache = await c.inline(key);
    };

    // Store request data for recording
    const record: null | Partial<RecordData> = opts.requestRecorderPath
      ? {}
      : null;
    if (record) {
      record.addon = addon.getId();
      record.action = action;
      record.input = cloneDeep(input);
    }

    // Responder object
    const responder = new Responder(
      record,
      async (statusCode: number, body: any) => {
        res.status(statusCode).json(body);
      }
    );

    // Handle the request
    let statusCode = 200;
    let output: any;
    try {
      output = await handler(
        input,
        {
          request: req,
          sig: sigData,
          cache,
          requestCache,
          fetch: createTaskFetch(opts, responder, cache),
          recaptcha: createTaskRecaptcha(opts, responder, cache),
        },
        addon
      );
      switch (action) {
        case "resolve":
        case "captcha":
          if (output === null) throw new Error("Nothing found");
          break;
      }
      if (migrations[action]?.response) {
        output = migrations[action].response(migrationCtx, input, output);
      } else {
        output = migrationCtx.validator.response(output);
      }
      if (inlineCache) await inlineCache.set(output);
    } catch (error) {
      if (error instanceof CacheFoundError) {
        if (error.result !== undefined) {
          output = error.result;
        } else {
          statusCode = 500;
          output = { error: error.error };
        }
      } else {
        if (inlineCache) await inlineCache.setError(error);
        statusCode = 500;
        output = { error: error.message || error };
        if (!error.noBacktraceLog) console.warn(error);
      }
    }

    const type =
      typeof output === "object" && output?.kind === "taskRequest"
        ? "task"
        : "response";
    const id = await responder.send(type, statusCode, output);
    responder.setTransport(id, null);
  };

  return actionHandler;
};

const createAddonRouter = (
  addon: BasicAddonClass,
  options: IServeAddonsOptions
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
        options,
      });
    } else {
      // Redirect to index page
      res.redirect("..");
    }
  });

  const actionHandler = createActionHandler(addon, options);

  const taskHandler = createTaskResponseHandler(addon, options.cache);

  const routeRegex = /^\/([^/]*?)(?:-(task))?(?:\.watched)?$/;
  const routeHandler: express.RequestHandler = (req, res, next) => {
    if (req.params[1] === "task") {
      return taskHandler(req, res, next);
    }
    return actionHandler(req, res, next);
  };

  router.get(routeRegex, routeHandler);
  router.post(routeRegex, routeHandler);

  return router;
};

export const createSingleAddonRouter = (
  addons: BasicAddonClass[],
  options: IServeAddonsOptions
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
  options: IServeAddonsOptions
) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Got replaced by a GET /addon.watched call
      // Send all addon id's
      res.send({
        watched: "index",
        addons: addons.map((addon) => addon.getId()),
      });
    } else {
      // TODO: Get get addon props from the action handler `addon`
      res.render("index", {
        addons: addons.map((addon) => addon.getProps()),
        options,
      });
    }
  });

  router.get("/addon.watched", (req, res) => {
    // New discovery which replaces wtchDiscover
    res.send({
      type: "server",
      addons: addons.map((addon) => addon.getId()),
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
  opts?: Partial<IServeAddonsOptions>
): express.Application => {
  const options: IServeAddonsOptions = defaults(opts, defaultServeOpts);
  const app = options.app || express();

  if (options.logRequests) {
    app.use(morgan("dev"));
  }

  if (options.preMiddlewares.length) {
    app.use(...options.preMiddlewares);
  }

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

  if (options.postMiddlewares.length) {
    app.use(...options.postMiddlewares);
  }

  app.use(options.errorHandler);

  return app;
};

export const serveAddons = (
  addons: BasicAddonClass[],
  opts?: Partial<IServeAddonsOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
  const options: IServeAddonsOptions = defaults(opts, defaultServeOpts);
  const app = createApp(addons, options);

  const listenPromise = new Promise<void>((resolve) => {
    app.listen(app.get("port"), () => {
      console.info(`Using cache: ${options.cache.engine.constructor.name}`);
      console.info(`Listening on ${app.get("port")}`);

      resolve();
    });
  });

  return { app, listenPromise };
};
