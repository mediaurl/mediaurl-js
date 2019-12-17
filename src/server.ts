import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";

import { BasicAddon } from "./addons/BasicAddon";
import { RepositoryAddon } from "./addons/RepositoryAddon";
import { errorHandler } from "./error-handler";
import {
    createFetchRemote,
    createTaskResultHandler,
    Responder
} from "./utils/fetch-remote";

export interface ServeAddonOptions {
    errorHandler: express.ErrorRequestHandler;
    port: number;
}

const _isDiscoveryQuery = (req: express.Request): boolean =>
    !!req.query.wtchDiscover;

const defaultServeOpts: ServeAddonOptions = {
    errorHandler,
    port: parseInt(<string>process.env.PORT) || 3000
};

const createActionHandler = (addon: BasicAddon) => {
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

const _makeAddonRouter = (addon: BasicAddon) => {
    const router = express.Router();

    router.get("/health", (req, res) => {
        return res.send("OK");
    });

    router.get("/", (req, res) => {
        if (_isDiscoveryQuery(req)) {
            return res.send({
                watched: true,
                hasRepository: addon.hasRepository
            });
        }

        res.send("TODO: Create landing page");
    });

    router.post("/:action", createActionHandler(addon));

    if (process.env.NODE_ENV === "development") {
        router.get("/:action", createActionHandler(addon));
    }

    router.post("/:action/task", createTaskResultHandler(addon));

    return router;
};

export const generateRouter = (
    appdata: BasicAddon | BasicAddon[]
): express.Router => {
    const router = express.Router();

    router.use(bodyParser.json());

    let rootAddon: BasicAddon | null = null;
    let addons: BasicAddon[];
    if (appdata instanceof RepositoryAddon) {
        rootAddon = appdata;
        addons = (<RepositoryAddon>rootAddon).getAddons();
        addons.forEach(addon => {
            addon.hasRepository = true;
        });
    } else if (appdata instanceof BasicAddon) {
        rootAddon = appdata;
        addons = [];
    } else {
        addons = appdata;
    }

    if (rootAddon) {
        console.info(`Mounting ${rootAddon.getProps().id} to /`);
        rootAddon.isRootAddon = true;
        router.use("/", _makeAddonRouter(rootAddon));
    }

    addons.forEach(addon => {
        const { id } = addon.getProps();
        console.info(`Mounting ${id} to /${id}`);
        router.use(`/${id}`, _makeAddonRouter(addon));
    });

    return router;
};

export const serveAddons = (
    appdata: BasicAddon | BasicAddon[],
    opts?: Partial<ServeAddonOptions>
): { app: express.Application; listenPromise: Promise<void> } => {
    const app = express();
    const options = defaults(opts, defaultServeOpts);
    const port = options.port;

    app.use("/", generateRouter(appdata));

    app.use(options.errorHandler);

    const listenPromise = new Promise<void>(resolve => {
        app.listen(port, () => {
            console.info(`Listening on ${port}`);
            resolve();
        });
    });

    return { app, listenPromise };
};
