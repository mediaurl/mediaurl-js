import { TranslatedText } from "@watchedcom/schema";
import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import * as morgan from "morgan";
import * as path from "path";
import "pug";
import { errorHandler } from "./error-handler";
import { AddonHandler, Engine, EngineOptions, RequestInfos } from "./types";

export interface IExpressServerOptions {
  /**
   * Addon engine options
   */
  engineOptions: Partial<EngineOptions>;

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
  // Engine options
  engineOptions: {},

  // Express options
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
  addonHandler: AddonHandler,
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
        addons: [addonHandler.addon.getProps()],
        options,
      });
    } else {
      // Redirect to index page
      res.redirect("..");
    }
  });

  // Register addon routes
  const routeRegex = /^\/([^/]*?)(?:-(task))?(?:\.watched)?$/; // Legacy
  // const routeRegex = /^\/([^/]*?):\.watched$/; // New
  const routeHandler: express.RequestHandler = async (req, res, next) => {
    await addonHandler.call({
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
  if (engine.length !== 1) {
    throw new Error(
      `The single addon router only supports one addon at a time. ` +
        `You tried to start the server with ${engine.length} addons.`
    );
  }

  console.info(`Mounting addon ${engine[0].addon.getId()} on /`);
  return createAddonRouter(engine[0], options);
};

export const createMultiAddonRouter = (
  engine: Engine,
  options: IExpressServerOptions
) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    if (req.query.wtchDiscover) {
      // Legacy. Got replaced by a GET /addon.watched call
      // Send all addon id's
      res.send({
        watched: "index",
        addons: engine.map(({ addon }) => addon.getId()),
      });
    } else {
      // TODO: Get get addon props from the action handler `addon`
      res.render("index", {
        addons: engine.map(({ addon }) => addon.getProps()),
        options,
      });
    }
  });

  router.get("/addon.watched", (req, res) => {
    // New discovery which replaces wtchDiscover
    res.send({
      type: "server",
      addons: engine.map(({ addon }) => addon.getId()),
    });
  });

  const ids = new Set();
  for (const addonHandler of engine) {
    const id = addonHandler.addon.getId();
    if (ids.has(id)) throw new Error(`Addon ID "${id}" is already exists.`);
    ids.add(id);
    console.info(`Mounting addon ${id}`);
    router.use(`/${id}`, createAddonRouter(addonHandler, options));
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
