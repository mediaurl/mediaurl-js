import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";
import * as morgan from "morgan";
import * as path from "path";
import { BasicAddon } from "./addons/BasicAddon";
import { BasicCache } from "./cache/BasicCache";
import { LocalCache } from "./cache/LocalCache";
import { RedisCache } from "./cache/RedisCache";
import { errorHandler } from "./error-handler";
import {
    createFetchRemote,
    createTaskResultHandler,
    Responder
} from "./utils/fetch-remote";
import { getActionValidator } from "./validators";

export interface ServeAddonOptions {
    logRequests: boolean;
    errorHandler: express.ErrorRequestHandler;
    port: number;
    cache: BasicCache;
}

const defaultServeOpts: ServeAddonOptions = {
    errorHandler,
    port: parseInt(<string>process.env.PORT) || 3000,
    cache: process.env.REDIS_CACHE
        ? new RedisCache({ url: process.env.REDIS_CACHE })
        : new LocalCache(),
    logRequests: true
};

const createActionHandler = (addon: BasicAddon, cache: BasicCache) => {
    const actionHandler: express.RequestHandler = async (req, res, next) => {
        const { action } = req.params;

        const handler = addon.getActionHandler(action);
        const validator = getActionValidator(action);
        validator.request(req.body);

        const responder = new Responder(
            async (statusCode: number, body: any) => {
                res.status(statusCode).send(body);
            }
        );

        let statusCode = 200;
        let result;
        try {
            result = await handler(req.body, {
                addon,
                request: req,
                cache,
                fetchRemote: createFetchRemote(responder, cache)
            });
            validator.response(result);
        } catch (error) {
            statusCode = 500;
            result = { error: error.message || error };
        }

        responder.send(statusCode, result);
    };

    return actionHandler;
};

const _makeAddonRouter = (addon: BasicAddon, cache: BasicCache) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        if (req.query.wtchDiscover) {
            res.send({ watched: "addon" });
            return;
        }

        // let addons;
        // if (addon.getType() === "repository") {
        //     // TODO: Get the real requested language
        //     const args = { language: "en" };
        //     const ctx = {
        //         addon,
        //         request: req,
        //         cache,
        //         fetchRemote: dummyFetchRemote
        //     };
        //     addons = await (<RepositoryAddon>addon).getAllAddonProps(args, ctx);
        // }
        res.render("addon", { addon: addon.getProps() });
    });

    router.post("/:action", createActionHandler(addon, cache));
    if (process.env.NODE_ENV === "development") {
        router.get("/:action", createActionHandler(addon, cache));
    }

    router.post("/:action/task", createTaskResultHandler(addon, cache));

    return router;
};

export const generateRouter = (
    addons: BasicAddon[],
    cache: BasicCache
): express.Router => {
    const router = express.Router();
    router.use(bodyParser.json({ limit: "10mb" }));

    const ids = new Set();
    addons.forEach(addon => {
        const id = addon.getId();
        if (ids.has(id)) throw new Error(`Addon ID "${id}" is already exists.`);
        ids.add(id);
        console.info(`Mounting ${id} to /${id}`);
        router.use(`/${id}`, _makeAddonRouter(addon, cache));
    });

    return router;
};

export const serveAddons = (
    addons: BasicAddon[],
    opts?: Partial<ServeAddonOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
    const app = express();
    const options = defaults(opts, defaultServeOpts);
    const { port, cache } = options;

    if (options.logRequests) {
        app.use(morgan("dev"));
    }

    app.set("views", path.join(__dirname, "..", "views"));
    app.set("view engine", "pug");

    app.use("/", generateRouter(addons, cache));
    app.get("/", (req, res) => {
        if (req.query.wtchDiscover) {
            res.send({
                watched: "index",
                addons: addons.map(addon => addon.getId())
            });
            return;
        }
        res.render("index", { addons: addons.map(addon => addon.getProps()) });
    });
    app.get("/health", (req, res) => {
        res.send("OK");
    });
    app.use(options.errorHandler);

    const listenPromise = new Promise<void>(resolve => {
        app.listen(port, () => {
            console.info(`Listening on ${port}`);
            resolve();
        });
    });

    return { app, listenPromise };
};
