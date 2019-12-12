import * as express from "express";
import "express-async-errors";

import { WorkerAddon } from "./addons";
import { errorHandler } from "./error-handler";

export interface ServeAddonOptions {
    errorHandler: express.ErrorRequestHandler;
}

const defaultServeOpts: ServeAddonOptions = {
    errorHandler
};

const _makeAddonRouter = (addon: WorkerAddon) => {
    const router = express.Router();

    router.get("/health", (req, res) => {
        return res.send("OK");
    });

    router.post("/:action", async (req, res, next) => {
        const { action } = req.params;
        const resp = await addon.handleAction(action, {});
        res.send({ action, resp });
    });

    return router;
};

export const generateAddonsRouter = (addons: WorkerAddon[]): express.Router => {
    const router = express.Router();

    addons.forEach(addon => {
        router.use(`/${addon.getProps().id}`, _makeAddonRouter(addon));
    });

    return router;
};

export const serveAddons = async (
    addons: WorkerAddon[],
    opts: ServeAddonOptions = defaultServeOpts
): Promise<{ app: express.Application; listenPromise: Promise<void> }> => {
    const app = express();
    const port = parseInt(<string>process.env.PORT) || 3000;

    app.use("/", generateAddonsRouter(addons));

    app.use(opts.errorHandler);

    const listenPromise = new Promise<void>(resolve => {
        app.listen(port, resolve);
    });

    return { app, listenPromise };
};
