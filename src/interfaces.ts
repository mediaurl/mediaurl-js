import * as express from "express";

import { BasicAddon } from "./addons/BasicAddon";
import { FetchRemoteFn } from "./utils/fetch-remote";

export type ActionHandler<
    InputType = any,
    OutputType = any,
    AddonType extends BasicAddon = BasicAddon
> = (
    input: InputType,
    context: {
        request: express.Request;
        addon: AddonType;
        fetchRemote: FetchRemoteFn;
    }
) => Promise<OutputType>;

export interface ActionsMap {
    [action: string]: ActionHandler;
}
