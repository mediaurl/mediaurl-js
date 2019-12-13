import * as bodyParser from "body-parser";
import * as express from "express";
import "express-async-errors";
import { defaults } from "lodash";

import { WorkerAddon } from "./addons";
import { errorHandler } from "./error-handler";
import { fetchRemote } from "./utils/fetch-remote";
import { validateActionPostBody } from "./validators";

export interface ServeAddonOptions {
    errorHandler: express.ErrorRequestHandler;
    port: number;
}

const defaultServeOpts: ServeAddonOptions = {
    errorHandler,
    port: parseInt(<string>process.env.PORT) || 3000
};

const _makeAddonRouter = (addon: WorkerAddon) => {
    const router = express.Router();

    router.get("/health", (req, res) => {
        return res.send("OK");
    });

    router.get("/props", (req, res) => {
        res.send(addon.getProps());
    });

    router.post("/:action", async (req, res, next) => {
        const { action } = req.params;

        const handler = addon.getActionHandler(action);

        const result = await handler(req.body, {
            addon,
            request: req,
            fetchRemote
        });

        res.send(result);
    });

    return router;
};

export const generateAddonsRouter = (addons: WorkerAddon[]): express.Router => {
    const router = express.Router();

    router.use(bodyParser.json());

    addons.forEach(addon => {
        router.use(`/${addon.getProps().id}`, _makeAddonRouter(addon));
    });

    return router;
};

export const serveAddons = (
    addons: WorkerAddon[],
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
