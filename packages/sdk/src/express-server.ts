import { TranslatedText } from "@watchedcom/schema";
import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import * as morgan from "morgan";
import * as path from "path";
import "pug";
import { BasicAddonClass } from "./addons";
import { createAddonHandler } from "./engine";
import { errorHandler } from "./error-handler";
import { AddonHandlerOptions, RequestInfos } from "./types";

export interface IExpressServerOptions {
  /**
   * Addon handler options
   */
  addonOptions: Partial<AddonHandlerOptions>;

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
  addonOptions: {},

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
  serverOptions: {
    ...defaultOptions.addonOptions,
    ...options?.addonOptions,
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

  // Create the action handler function for this addon
  const handleAction = createAddonHandler(options.addonOptions, addon);

  // Register addon routes
  const routeRegex = /^\/([^/]*?)(?:-(task))?(?:\.watched)?$/; // Legacy
  // const routeRegex = /^\/([^/]*?):\.watched$/; // New
  const routeHandler: express.RequestHandler = async (req, res, next) => {
    await handleAction({
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
  const options: IExpressServerOptions = getOptions(opts);
  const app = createApp(addons, options);

  const listenPromise = new Promise<void>((resolve) => {
    app.listen(app.get("port"), () => {
      console.info(`Listening on ${app.get("port")}`);
      resolve();
    });
  });

  return { app, listenPromise };
};
