import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";
import * as morgan from "morgan";

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
        } catch (error) {
            statusCode = 500;
            result = { error: error.message || error };
        }

        validator.response(result);
        responder.send(statusCode, result);
    };

    return actionHandler;
};

const _makeAddonRouter = (addon: BasicAddon, cache: BasicCache) => {
    const router = express.Router();
    router.get("/", (req, res) => {
        if (req.query.wtchDiscover) {
            res.send({ watched: true });
        } else {
            res.send("TODO: Create addon detail page");
        }
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

    addons.forEach(addon => {
        const { id } = addon.getProps();
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

    app.use("/", generateRouter(addons, cache));
    app.get("/", (req, res) => {
        res.send("TODO: Create addon index page");
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
