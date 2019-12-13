import * as express from "express";

import { WorkerAddon } from "./addons";
import { FetchRemoteFn } from "./utils/fetch-remote";

export type ActionHandler<InputType = any, OutputType = any> = (
    input: InputType,
    context: {
        request: express.Request;
        addon: WorkerAddon;
        fetchRemote: FetchRemoteFn;
    }
) => Promise<OutputType>;

export interface IWorkerAddon {
    registerActionHandler(action: string, handler: ActionHandler): this;
    unregisterActionHandler(action: string): void;
    getActionHandler(action: string): ActionHandler;
}
