import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";

import { BasicAddon } from "./addons/BasicAddon";
import { WorkerAddon } from "./addons/WorkerAddon";
import { errorHandler } from "./error-handler";
import { IAddon } from "./interfaces";
import {
    createFetchRemote,
    createTaskResultHandler,
    Responder
} from "./utils/fetch-remote";
import { validateActionPostBody } from "./validators";

export interface ServeAddonOptions {
    errorHandler: express.ErrorRequestHandler;
    port: number;
}

const defaultServeOpts: ServeAddonOptions = {
    errorHandler,
    port: parseInt(<string>process.env.PORT) || 3000
};

const createActionHandler = (addon: IAddon) => {
    const actionHandler: express.RequestHandler = async (req, res, next) => {
        const { action } = req.params;

        const handler = addon.getActionHandler(action);

        const responder: Responder = {
            send: async (statusCode, body) => {
                res.status(statusCode).send(body);
            }
        };

        // TODO: Catch errors and return an ApiError response
        const result = await handler(req.body, {
            addon,
            request: req,
            fetchRemote: createFetchRemote(responder)
        });

        responder.send(200, result);
    };

    return actionHandler;
};

const _makeAddonRouter = (addon: IAddon) => {
    const router = express.Router();

    router.get("/health", (req, res) => {
        return res.send("OK");
    });

    router.post("/:action", createActionHandler(addon));
    router.post("/:action/task", createTaskResultHandler(addon));

    return router;
};

export const generateAddonsRouter = (addons: BasicAddon[]): express.Router => {
    const router = express.Router();

    router.use(bodyParser.json());

    addons.forEach(addon => {
        router.use(`/${addon.getProps().id}`, _makeAddonRouter(addon));
    });

    return router;
};

export const serveAddons = (
    addons: BasicAddon[],
    opts?: Partial<ServeAddonOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
    const app = express();
    const options = defaults(opts, defaultServeOpts);
    const port = options.port;

    app.use("/", generateAddonsRouter(addons));

    app.use(options.errorHandler);

    const listenPromise = new Promise<void>(resolve => {
        app.listen(port, resolve);
    });

    return { app, listenPromise };
};
