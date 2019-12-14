import * as express from "express";

import { FetchRemoteFn } from "./utils/fetch-remote";

export type ActionHandler<InputType = any, OutputType = any> = (
    input: InputType,
    context: {
        request: express.Request;
        addon: IAddon;
        fetchRemote: FetchRemoteFn;
    }
) => Promise<OutputType>;

export interface IAddon {
    registerActionHandler(action: string, handler: ActionHandler): this;
    unregisterActionHandler(action: string): void;
    getActionHandler(action: string): ActionHandler;
}

export interface ActionsMap {
    [action: string]: ActionHandler;
}
