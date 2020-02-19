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
      res.send({ watched: "addon" });
    } else if (options.singleMode) {
      // In single mode, render the index page
      res.render("index", {
        addons: [addon.getProps()],
        options
      });
    } else {
      // Redirect to index page
      res.redirect("..");
    }
  });

  router.post("/:action", createActionHandler(addon, options.cache));
  if (process.env.NODE_ENV === "development") {
    // Allow GET requests in development mode
    router.get("/:action", createActionHandler(addon, options.cache));
  }
  router.post("/:action/task", createTaskResponseHandler(addon, options.cache));
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
      res.send({
        watched: "index",
        addons: addons.map(addon => addon.getId()),
        options
      });
    } else {
      res.render("index", {
        addons: addons.map(addon => addon.getProps()),
        options
      });
    }
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
