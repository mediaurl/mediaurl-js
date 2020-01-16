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

export type StrictActionOptions = {
    cache: {
        keyPrefix: string;
        enabled: boolean;
        cacheErrors: boolean;
        ttl: number; // Cache time in seconds
        errorTtl: number;
    };
};

export type ActionOptions = {
    cache?: Partial<StrictActionOptions["cache"]>;
};

export const defaultActionOptions: StrictActionOptions = {
    cache: {
        keyPrefix: "",
        enabled: false,
        cacheErrors: true,
        ttl: 3600, // Cache time in seconds
        errorTtl: 600
    }
};

export interface ActionHandlerContext<
    AddonType extends BasicAddon = BasicAddon
> {
    request: express.Request;
    addon: AddonType;
    cache: null | BasicCache;
    fetchRemote: FetchRemoteFn;
}

export type ActionHandler<
    InputType = any,
    OutputType = any,
    AddonType extends BasicAddon = BasicAddon
> = (
    input: InputType,
    context: ActionHandlerContext<AddonType>
) => Promise<OutputType>;

export interface HandlersMap {
    [action: string]: ActionHandler;
}
export interface HandlerOptionsMap {
    [action: string]: StrictActionOptions;
}

/**
 * Should include all available handlers
 * It's base type to pick from (by action)
 */
export type ActionHandlers<T extends BasicAddon> = {
    addon: ActionHandler<ApiAddonRequest, ApiAddonResponse, T>;

    repository: ActionHandler<ApiRepositoryRequest, ApiRepositoryResponse, T>;

    directory: ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse, T>;
    item: ActionHandler<ApiItemRequest, ApiItemResponse, T>;
    source: ActionHandler<ApiSourceRequest, ApiSourceResponse, T>;
    subtitle: ActionHandler<ApiSubtitleRequest, ApiSubtitleResponse, T>;
    resolve: ActionHandler<ApiResolveRequest, ApiResolveResponse, T>;
};
