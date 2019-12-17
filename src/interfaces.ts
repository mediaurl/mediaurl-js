import {
    ApiAddonRequest,
    ApiAddonResponse,
    ApiDirectoryRequest,
    ApiDirectoryResponse,
    ApiItemRequest,
    ApiItemResponse,
    ApiRepositoryRequest,
    ApiRepositoryResponse,
    ApiResolveRequest,
    ApiResolveResponse,
    ApiSourceRequest,
    ApiSourceResponse,
    ApiSubtitleRequest,
    ApiSubtitleResponse
} from "@watchedcom/schema";
import * as express from "express";

import { BasicAddon } from "./addons/BasicAddon";
import { BasicCache } from "./cache/BasicCache";
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
        cache: null | BasicCache;
        fetchRemote: FetchRemoteFn;
    }
) => Promise<OutputType>;

export interface HandlersMap {
    [action: string]: ActionHandler;
}

/**
 * Should include all available handlers
 * It's base type to pick from (by action)
 */
export type ActionHandlers<T extends BasicAddon> = {
    addon: ActionHandler<ApiAddonRequest, ApiAddonResponse, T>;

    directory: ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse, T>;
    item: ActionHandler<ApiItemRequest, ApiItemResponse, T>;
    source: ActionHandler<ApiSourceRequest, ApiSourceResponse, T>;
    subtitle: ActionHandler<ApiSubtitleRequest, ApiSubtitleResponse, T>;
    resolve: ActionHandler<ApiResolveRequest, ApiResolveResponse, T>;

    repository: ActionHandler<ApiRepositoryRequest, ApiRepositoryResponse, T>;
};
