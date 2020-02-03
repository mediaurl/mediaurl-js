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

import { BasicAddon } from "./addons";
import { BasicCache } from "./cache";
import { FetchRemoteFn } from "./tasks";

export type CacheOptions = {
  // Should errors be cached? Defaults to true.
  cacheErrors: boolean;
  // TTL in seconds. Defaults to 1 hours.
  ttl: number;
  // TTL for error responses in seconds. Defaults to 10 minutes.
  errorTtl: number;
};

export const defaultCacheOptions: CacheOptions = {
  cacheErrors: true,
  ttl: 3600,
  errorTtl: 600
};

export type CacheState = {
  options: CacheOptions;
  key: string;
};

export type RequestCacheFn = (
  // Data which will be used as the key for caching. Defaults to the full request data.
  keyData?: any,
  options?: Partial<CacheOptions>
) => Promise<void>;

export interface ActionHandlerContext<
  AddonType extends BasicAddon = BasicAddon
> {
  request: express.Request;
  addon: AddonType;
  cache: BasicCache;
  // Helper function to cache full action calls. Run this
  // on the beginning of your action handler to check
  // if the request is cached already.
  // If there is a cache hit, the request will be aborted
  // automatically.
  requestCache: RequestCacheFn;
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
