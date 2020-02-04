import {
  AddonRequest,
  AddonResponse,
  DirectoryRequest,
  DirectoryResponse,
  ItemRequest,
  ItemResponse,
  RepositoryRequest,
  RepositoryResponse,
  ResolveRequest,
  ResolveResponse,
  SourceRequest,
  SourceResponse,
  SubtitleRequest,
  SubtitleResponse
} from "@watchedcom/schema";
import * as express from "express";
import { BasicAddon } from "./addons";
import { CacheHandler } from "./cache";
import { FetchRemoteFn } from "./tasks";

export type CacheOptions = {
  // Should errors be cached? Defaults to true.
  cacheErrors: boolean;
  // TTL in milliseconds. Defaults to 1 hours.
  ttl: number;
  // TTL for error responses in milliseconds. Defaults to 10 minutes.
  errorTtl: number;
  // Prefix. Defaults to addon id, version and current action
  prefix: null | any;
};

export const defaultCacheOptions: CacheOptions = {
  cacheErrors: true,
  ttl: 3600 * 1000,
  errorTtl: 600 * 1000,
  prefix: null
};

export type InlineCacheContext = {
  set: (key: any, value: any, ttl: null | CacheOptions["ttl"]) => Promise<void>;
  setError: (
    key: any,
    value: any,
    errorTtl: null | CacheOptions["errorTtl"]
  ) => Promise<void>;
};

export type RequestCacheFn = (
  // Data which will be used as the key for caching. Defaults to the full request data.
  key?: any,
  options?: Partial<CacheOptions>
) => Promise<void>;

export interface ActionHandlerContext<
  AddonType extends BasicAddon = BasicAddon
> {
  request: express.Request;
  sig: {
    raw: string;
    data: any;
  };
  addon: AddonType;
  cache: CacheHandler;
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
  addon: ActionHandler<AddonRequest, AddonResponse, T>;

  repository: ActionHandler<RepositoryRequest, RepositoryResponse, T>;

  directory: ActionHandler<DirectoryRequest, DirectoryResponse, T>;
  item: ActionHandler<ItemRequest, ItemResponse, T>;
  source: ActionHandler<SourceRequest, SourceResponse, T>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse, T>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse, T>;
};
