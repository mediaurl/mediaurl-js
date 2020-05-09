import { TranslatedText } from "@watchedcom/schema";
import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import * as morgan from "morgan";
import * as path from "path";
import "pug";
import { BasicAddonClass } from "./addons";
import { CacheHandler, getCacheEngineFromEnv } from "./cache";
import { handleAction, initializeAddon } from "./engine";
import { errorHandler } from "./error-handler";
import { IExpressServerOptions } from "./interfaces";

export class ServeAddonOptions implements Partial<IExpressServerOptions> {
  constructor(props: Partial<IExpressServerOptions>) {
    Object.assign(this, props);
  }
}

const defaultServeOpts: IExpressServerOptions = {
  // Engine options
  cache: new CacheHandler(getCacheEngineFromEnv()),
  requestRecorderPath: null,
  replayMode: false,
  middlewares: {
    init: [],
    request: [],
    response: [],
  },

  // Express options
  singleMode: false,
  logRequests: true,
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  preMiddlewares: [],
  postMiddlewares: [],
};

const applyDefaultOptions = (options?: Partial<IExpressServerOptions>) => ({
  ...defaultServeOpts,
  ...options,
  middlewares: {
    ...defaultServeOpts.middlewares,
    ...options?.middlewares,
  },
});

const createAddonRouter = (
  addon: BasicAddonClass,
  options: IExpressServerOptions
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

  // Initialize the addon
  initializeAddon(options, addon);

  // Register addon routes
  const routeRegex = /^\/([^/]*?)(?:-(task))?(?:\.watched)?$/; // Legacy
  // const routeRegex = /^\/([^/]*?):\.watched$/; // New
  const routeHandler: express.RequestHandler = async (req, res, next) => {
    await handleAction({
      opts: options,
      addon,
      action: req.params[1] === "task" ? "task" : req.params[0],
      input:
        req.method === "POST"
          ? req.body
          : req.query.data
          ? JSON.parse(<string>req.query.data)
          : {},
      sig: <string>req.headers["watched-sig"] ?? "",
      request: req,
      sendResponse: async (statusCode, data) => {
        res.status(statusCode).json(data);
      },
    });
  };
  router.get(routeRegex, routeHandler);
  router.post(routeRegex, routeHandler);

  return router;
};

export const createSingleAddonRouter = (
  addons: BasicAddonClass[],
  options: IExpressServerOptions
) => {
  if (addons.length !== 1) {
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
  options: IExpressServerOptions
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
  opts?: Partial<IExpressServerOptions>
): express.Application => {
  const options: IExpressServerOptions = applyDefaultOptions(opts);
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
  opts?: Partial<IExpressServerOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
  const options: IExpressServerOptions = applyDefaultOptions(opts);
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
