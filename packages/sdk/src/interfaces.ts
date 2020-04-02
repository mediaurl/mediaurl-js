import {
  AddonRequest,
  AddonResponse,
  CaptchaRequest,
  CaptchaResponse,
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
import { BasicAddonClass } from "./addons";
import { CacheHandler } from "./cache";
import { FetchFn, RecaptchaFn } from "./tasks";

export type CacheOptions = {
  /**
   * TTL in milliseconds. When this is
   * a function, the cache value will be passed as parameter.
   * This can be useful to for example set a special TTL on
   * an empty value.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   *
   * Default: 1 hour
   */
  ttl: null | number | ((value: any) => null | number);
  /**
   * TTL for errors in milliseconds.
   * When it's a function, the error will be passed as parameter.
   * To disable error caching, set this to `null`.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   *
   * Default: 10 minutes
   */
  errorTtl: null | number | ((error: any) => null | number);
  /**
   * After this amount of miliseconds, the cache will be refreshed once.
   * Next requests will still access the currently cached value.
   * This value should be below `ttl`, and maybe also below `errorTtl`.
   * This functionality can be very useful to prevent race conditions
   * and to maintain a stable cache database.
   *
   * Default: `null`
   */
  refreshInterval: null | number;
  /**
   * When the current cache is getting refreshed and an error occoured,
   * should this overwrite the current value?
   *
   * Default: `false`
   */
  storeRefreshErrors: boolean;
  /**
   * This value is for the `call` and `inline` functions.
   * To prevent race conditions like two users requesting the same key at
   * the same time, the executing will wait until either the lock is
   * released or a result is written to the key.
   * The timeout should be little more than the usual execution time of
   * the function.
   *
   * To disable this feature, set it to `null`.
   * Set this to a timeout in miliseconds, or to `Infinity`.
   *
   * Default: 30 seconds
   */
  simultanLockTimeout: null | number;
  /**
   * The `sleep` parameter of the `waitKey` function.
   *
   * Default: 250 milliseconds
   */
  simultanLockTimeoutSleep: number;
  /**
   * Prefix. Defaults to addon ID.
   */
  prefix: null | string;
  /**
   * Calls to all `get` functions will always return `undefined`. Set is
   * still working normally. This is useful for testing.
   *
   * Default: `false`
   */
  disableGet: boolean;
};

export const defaultCacheOptions: CacheOptions = {
  ttl: 3600 * 1000,
  errorTtl: 600 * 1000,
  refreshInterval: null,
  storeRefreshErrors: false,
  simultanLockTimeout: 30 * 1000,
  simultanLockTimeoutSleep: 250,
  prefix: null,
  disableGet: false
};

export type InlineCacheContext = {
  set: (key: any, value: any, ttl: CacheOptions["ttl"]) => Promise<void>;
  setError: (
    key: any,
    value: any,
    errorTtl: CacheOptions["errorTtl"]
  ) => Promise<void>;
};

export type CacheOptionsParam = Partial<CacheOptions>;

export type RequestCacheFn = (
  /**
   * Data which will be used as the key for caching. Defaults to the full request data.
   * You should only use the the variables from the action handler's `input` parameter
   * which you are using in your script.
   */
  key?: any,
  options?: CacheOptionsParam
) => Promise<void>;

export interface ActionHandlerContext {
  request: express.Request;
  sig: {
    time: number;
    validUntil: number;
    user: string;
    status: "guest" | "free" | "pro";
    verified: boolean;
    ips: string[];
    error?: string;
    app: {
      platform: string;
      version: string;
      ok: boolean;
      [k: string]: any;
    };
    [k: string]: any;
  };
  cache: CacheHandler;
  /**
   * Helper function to cache full action calls. Run this
   * on the beginning of your action handler to check
   * if the request is cached already.
   * If there is a cache hit, the request will be aborted
   * automatically.
   */
  requestCache: RequestCacheFn;
  /**
   * Fetch an URL via the client app.
   */
  fetch: FetchFn;
  /**
   * Solve a recaptcha via the client app.
   */
  recaptcha: RecaptchaFn;
}

export type ActionHandler<
  InputType = any,
  OutputType = any,
  AddonClass extends BasicAddonClass = BasicAddonClass
> = (
  input: InputType,
  context: ActionHandlerContext,
  addon: AddonClass
) => Promise<OutputType>;

export interface HandlersMap {
  [action: string]: ActionHandler;
}

/**
 * Should include all available handlers.
 * It's base type to pick from (by action).
 */
export type ActionHandlers<T extends BasicAddonClass> = {
  addon: ActionHandler<AddonRequest, AddonResponse, T>;

  repository: ActionHandler<RepositoryRequest, RepositoryResponse, T>;

  directory: ActionHandler<DirectoryRequest, DirectoryResponse, T>;
  item: ActionHandler<ItemRequest, ItemResponse, T>;
  source: ActionHandler<SourceRequest, SourceResponse, T>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse, T>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse, T>;
  captcha: ActionHandler<CaptchaRequest, CaptchaResponse, T>;
};

export interface IServeAddonsOptions {
  /**
   * Start the server in single addon mode (default: true)
   */
  singleMode: boolean;
  /**
   * Log HTTP requests (default: true)
   */
  logRequests: boolean;
  /**
   * Write requests to the addon server to a file which can
   * be replayed later. This is very useful for testing or
   * to create test cases.
   */
  requestRecorderPath: null | string;
  /**
   * Express error handler
   */
  errorHandler: express.ErrorRequestHandler;
  /**
   * Listen port
   */
  port: number;
  /**
   * Cache handler
   */
  cache: CacheHandler;
  /**
   * Middlewares prepending to all app routes
   */
  preMiddlewares: express.RequestHandler[];
  /**
   * Middlewares that are executed at the end, but BEFORE error handler
   */
  postMiddlewares: express.RequestHandler[];
  /**
   * Your custom Express app instance
   */
  app?: express.Application;
}
