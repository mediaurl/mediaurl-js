import * as express from "express";

import { WorkerAddon } from "./addons";

export interface ServeAddonOptions {}

const defaultServeOpts: ServeAddonOptions = {};

export const generateAddonsRouter = (addons: WorkerAddon[]): express.Router => {
    const router = express.Router();

    addons.forEach(addon => {
        const childRouter = express.Router();
        const props = addon.getProps();

        childRouter.get("/health", (req, res) => {
            return res.send("OK");
        });

        router.use(`/${props.id}`, childRouter);
    });

    return router;
};

export const serveAddons = async (
    addons: WorkerAddon[],
    opts: ServeAddonOptions = defaultServeOpts
): Promise<{ app: express.Application }> => {
    const app = express();
    const port = parseInt(<string>process.env.PORT) || 3000;

    app.use("/", generateAddonsRouter(addons));

    await new Promise(resolve => {
        app.listen(port, resolve);
    });

    return { app };
};
