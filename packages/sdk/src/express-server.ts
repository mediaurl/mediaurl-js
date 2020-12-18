import { TranslatedText } from "@watchedcom/schema";
import bodyParser from "body-parser";
import express from "express";
import "express-async-errors";
import morgan from "morgan";
import path from "path";
import "pug";
import { BasicAddonClass } from "./addons";
import { errorHandler } from "./error-handler";
import { Engine, RequestInfos } from "./types";

export interface IExpressServerOptions {
  /**
   * Start the server in single addon mode (default: false)
   */
  singleMode: boolean;

  /**
   * Log HTTP requests (default: true)
   */
  logRequests: boolean;

  /**
   * Express error handler
   */
  errorHandler: express.ErrorRequestHandler;

  /**
   * Listen port
   */
  port: number;

  /**
   * Middlewares prepending to all app routes
   */
  preMiddlewares: express.RequestHandler[];

  /**
   * Middlewares that are executed at the end, but BEFORE error handler
   */
  postMiddlewares: express.RequestHandler[];

  /**
   * Your custom Express app instance
   */
  app?: express.Application;
}

export class ExpressServerAddonOptions
  implements Partial<IExpressServerOptions> {
  constructor(props: Partial<IExpressServerOptions>) {
    Object.assign(this, props);
  }
}

const defaultOptions: IExpressServerOptions = {
  singleMode: false,
  logRequests: true,
  errorHandler,
  port: parseInt(<string>process.env.PORT) || 3000,
  preMiddlewares: [],
  postMiddlewares: [],
};

const getOptions = (options?: Partial<IExpressServerOptions>) => ({
  ...defaultOptions,
  ...options,
});

const createAddonRouter = (
  engine: Engine,
  addon: BasicAddonClass,
  options: IExpressServerOptions
) => {
  const router = express.Router();
  router.use(bodyParser.json({ limit: "10mb" }));
  router.get("/", async (req, res) => {
    if (options.singleMode) {
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

  // Get addon handler
  const addonHandler = engine.createAddonHandler(addon);

  // Register addon routes
  const routeRegex = /^\/([^/]*?)(?:-(task))?(?:\.(?:watched|json))?$/; // Legacy
  // const routeRegex = /^\/([^/]*?):\.(?:watched|json)$/; // New
  const routeHandler: express.RequestHandler = async (req, res, next) => {
    await addonHandler({
      action: req.params[1] === "task" ? "task" : req.params[0],
      request: {
        ip: req.ip,
        headers: <RequestInfos["headers"]>req.headers,
      },
      sig: <string>req.headers["watched-sig"] ?? "",
      input:
        req.method === "POST"
          ? req.body
          : req.query.data
          ? JSON.parse(<string>req.query.data)
          : {},
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
  engine: Engine,
  options: IExpressServerOptions
) => {
  if (engine.addons.length !== 1) {
    throw new Error(
      `The single addon router only supports one addon at a time. ` +
        `You tried to start the server with ${engine.addons.length} addons.`
    );
  }

  const addon = engine.addons[0];
  engine.initialize();
  console.info(`Mounting addon ${addon.getId()} on /`);
  return createAddonRouter(engine, addon, options);
};

export const createMultiAddonRouter = (
  engine: Engine,
  options: IExpressServerOptions
) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    // TODO: Get get addon props from the action handler `addon`
    res.render("index", {
      addons: engine.addons.map((addon) => addon.getProps()),
      options,
    });
  });

  router.get(["/addon.watched", "/addon.json"], (req, res) => {
    // New discovery which replaces wtchDiscover
    res.send({
      type: "server",
      addons: engine.addons.map((addon) => addon.getId()),
    });
  });

  engine.initialize();

  const ids = new Set();
  for (const addon of engine.addons) {
    const id = addon.getId();
    if (ids.has(id)) throw new Error(`Addon ID "${id}" is already exists.`);
    ids.add(id);
    console.info(`Mounting addon ${id}`);
    router.use(`/${id}`, createAddonRouter(engine, addon, options));
  }

  return router;
};

export const createApp = (
  engine: Engine,
  opts?: Partial<IExpressServerOptions>
): express.Application => {
  const options: IExpressServerOptions = getOptions(opts);
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
    app.use("/", createSingleAddonRouter(engine, options));
  } else {
    // Mount all addons on /<id>
    app.use("/", createMultiAddonRouter(engine, options));
  }

  app.get("/health", (req, res) => res.send("OK"));

  if (options.postMiddlewares.length) {
    app.use(...options.postMiddlewares);
  }

  app.use(options.errorHandler);

  return app;
};

export const serveAddons = (
  engine: Engine,
  opts?: Partial<IExpressServerOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
  const options: IExpressServerOptions = getOptions(opts);
  const app = createApp(engine, options);

  const listenPromise = new Promise<void>((resolve) => {
    app.listen(app.get("port"), () => {
      console.info(`Listening on ${app.get("port")}`);
      resolve();
    });
  });

  return { app, listenPromise };
};
