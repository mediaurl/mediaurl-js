import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";
import * as morgan from "morgan";
import * as path from "path";
import { BasicAddon } from "./addons";
import { CacheFoundError, CacheHandler, LocalCache, RedisCache } from "./cache";
import { errorHandler } from "./error-handler";
import { RequestCacheFn } from "./interfaces";
import {
  createTaskFetch,
  createTaskRecaptcha,
  createTaskResponseHandler,
  Responder
} from "./tasks";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

export interface ServeAddonsOptions {
  singleMode: boolean;
  logRequests: boolean;
  errorHandler: express.ErrorRequestHandler;
  port: number;
  cache: CacheHandler;
}

const defaultServeOpts: ServeAddonsOptions = {
  singleMode: false,
  logRequests: true,
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  cache: new CacheHandler(
    process.env.REDIS_CACHE
      ? new RedisCache({ url: process.env.REDIS_CACHE })
      : new LocalCache()
  )
};

const createActionHandler = (addon: BasicAddon, cache: CacheHandler) => {
  try {
    addon.validateAddon();
  } catch (error) {
    throw new Error(
      `Validation of addon "${addon.getId()}" failed: ${error.message}`
    );
  }

  const actionHandler: express.RequestHandler = async (req, res) => {
    const requestData =
      req.method === "POST"
        ? req.body
        : req.query.data
        ? JSON.parse(req.query.data)
        : {};

    const action = req.params.action.replace(/\.watched$/, "");
    const handler = addon.getActionHandler(action);
    const validator = getActionValidator(action);
    validator.request(requestData);

    // Get sig contents
    let sig: string;
    if (requestData.sig) {
      // Legacy
      sig = requestData.sig;
      delete requestData.sig;
    } else {
      sig = <string>req.headers["watched-sig"] ?? "";
    }
    const sigData =
      process.env.SKIP_AUTH === "1" || action === "addon"
        ? null
        : validateSignature(sig);

    let statusCode = 200;
    let result: any;

    cache = cache.clone({
      prefix: [addon.getId(), addon.getVersion(), action]
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
    try {
      result = await handler(
        requestData,
        {
          request: req,
          sig: {
            raw: sig,
            data: sigData
          },
          cache,
          requestCache,
          fetch: createTaskFetch(responder, cache),
          recaptcha: createTaskRecaptcha(responder, cache)
        },
        addon
      );
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

    responder.send(statusCode, result);
  };

  return actionHandler;
};

const createAddonRouter = (addon: BasicAddon, options: ServeAddonsOptions) => {
  const router = express.Router();
  router.use(bodyParser.json({ limit: "10mb" }));
  router.get("/", async (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Will be replaced by a GET /addon.watched call
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

  const actionHandler = createActionHandler(addon, options.cache);
  const taskHandler = createTaskResponseHandler(addon, options.cache);

  router.get("/:action", actionHandler);
  router.get("/:action-task", taskHandler);
  router.post("/:action", actionHandler);
  router.post("/:action-task", taskHandler);

  router.get("/:action.watched", actionHandler);
  router.get("/:action-task.watched", taskHandler);
  router.post("/:action.watched", actionHandler);
  router.post("/:action-task.watched", taskHandler);

  return router;
};

export const createSingleAddonRouter = (
  addons: BasicAddon[],
  options: ServeAddonsOptions
) => {
  if (addons.length > 1) {
    throw new Error(
      `The single addon router only supports one addon at a time.` +
        `You tried to start the server with ${addons.length} addons.`
    );
  }

  console.info(`Mounting addon ${addons[0].getId()} on /`);
  return createAddonRouter(addons[0], options);
};

export const createMultiAddonRouter = (
  addons: BasicAddon[],
  options: ServeAddonsOptions
) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Will be replaced by a GET /addon.watched call
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
  addons: BasicAddon[],
  opts?: Partial<ServeAddonsOptions>
): express.Application => {
  const app = express();
  const options = defaults(opts, defaultServeOpts);

  if (options.logRequests) app.use(morgan("dev"));

  app.set("port", options.port);
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("view engine", "pug");

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
  addons: BasicAddon[],
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
