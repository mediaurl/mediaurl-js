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
  logRequests: boolean;
  errorHandler: express.ErrorRequestHandler;
  port: number;
  cache: CacheHandler;
}

const defaultServeOpts: ServeAddonsOptions = {
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  cache: new CacheHandler(
    process.env.REDIS_CACHE
      ? new RedisCache({ url: process.env.REDIS_CACHE })
      : new LocalCache()
  ),
  logRequests: true
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
    const { action } = req.params;

    const handler = addon.getActionHandler(action);
    const validator = getActionValidator(action);
    validator.request(req.body);

    const responder = new Responder(async (statusCode: number, body: any) => {
      res.status(statusCode).json(body);
    });

    // Remove sig from request
    const { sig, ...requestData } = req.body;
    const sigData =
      process.env.SKIP_AUTH === "1" || action === "addon"
        ? null
        : validateSignature(sig);

    let statusCode = 200;
    let result;

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

    try {
      result = await handler(requestData, {
        request: req,
        sig: {
          raw: sig,
          data: sigData
        },
        addon,
        cache,
        requestCache,
        fetch: createTaskFetch(responder, cache),
        recaptcha: createTaskRecaptcha(responder, cache)
      });
      validator.response(result);
      if (inlineCache) await inlineCache.set(result);
    } catch (error) {
      if (error instanceof CacheFoundError) {
        if (error.result) {
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

const createAddonRouter = (addon: BasicAddon, cache: CacheHandler) => {
  const router = express.Router();
  router.use(bodyParser.json({ limit: "10mb" }));
  router.get("/", async (req, res) => {
    if (req.query.wtchDiscover) {
      res.send({ watched: "addon" });
    } else {
      res.redirect("..");
    }
  });
  router.post("/:action", createActionHandler(addon, cache));
  if (process.env.NODE_ENV === "development") {
    router.get("/:action", createActionHandler(addon, cache));
  }
  router.post("/:action/task", createTaskResponseHandler(addon, cache));
  return router;
};

export const createRouter = (
  addons: BasicAddon[],
  cache: CacheHandler
): express.Router => {
  const router = express.Router();

  const ids = new Set();
  addons.forEach(addon => {
    const id = addon.getId();
    if (ids.has(id)) throw new Error(`Addon ID "${id}" is already exists.`);
    ids.add(id);
    console.info(`Mounting addon ${id}`);
    router.use(`/${id}`, createAddonRouter(addon, cache));
  });

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

  app.use("/", createRouter(addons, options.cache));

  app.get("/", (req, res) => {
    if (req.query.wtchDiscover) {
      res.send({
        watched: "index",
        addons: addons.map(addon => addon.getId())
      });
    } else {
      res.render("index", {
        addons: addons.map(addon => addon.getProps())
      });
    }
  });

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
