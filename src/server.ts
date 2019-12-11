import * as express from "express";

import { WorkerAddon } from "./addons";

export interface ServeAddonOptions {}

const defaultServeOpts: ServeAddonOptions = {};

export const generateAddonsRouter = (addons: WorkerAddon[]): express.Router => {
    const router = express.Router();
    return router;
};

export const serveAddons = async (
    addons: WorkerAddon[],
    opts: ServeAddonOptions = defaultServeOpts
): Promise<void> => {};
