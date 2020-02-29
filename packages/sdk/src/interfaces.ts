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
import { BasicAddon } from "./addons";
import { CacheHandler } from "./cache";
import { FetchFn, RecaptchaFn } from "./tasks";

export type CacheForever = "forever";

export type CacheOptions = {
  /**
   * TTL in milliseconds. Defaults to 1 hours. When this is
   * a function, the cache value will be passed as parameter.
   * This can be useful to for example set a special TTL on
   * an empty value.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `forever`.
   */
  ttl:
    | null
    | number
    | CacheForever
    | ((value: any) => null | number | CacheForever);
  /**
   * TTL for errors in milliseconds. Defaults to 10 minutes.
   * When it's a function, the error will be passed as parameter.
   * To disable error caching, set this to `null`.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `forever`.
   */
  errorTtl:
    | null
    | number
    | CacheForever
    | ((error: any) => null | number | CacheForever);
  /**
   * After this amount of miliseconds, the cache will be refreshed once.
   * Next requests will still access the currently cached value.
   * This value should be below `ttl`, and maybe also below `errorTtl`.
   * This functionality can be very useful to prevent race conditions
   * and to maintain a stable cache database.
   */
  refreshInterval: null | number;
  /**
   * When the current cache is getting refreshed and an error occoured,
   * should this overwrite the current value? Defaults to `false`.
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
   * Set this to a timeout in miliseconds, or to `forever`.
   * The default is to wait for 30 seconds.
   */
  simultanLockTimeout: null | number | CacheForever;
  /**
   * The `sleep` parameter of the `waitKey` function.
   */
  simultanLockTimeoutSleep: number;
  /**
   * Prefix. Defaults to addon id, version and action.
   */
  prefix: null | any;
};

export const defaultCacheOptions: CacheOptions = {
  ttl: 3600 * 1000,
  errorTtl: 600 * 1000,
  refreshInterval: null,
  storeRefreshErrors: false,
  simultanLockTimeout: 30 * 1000,
  simultanLockTimeoutSleep: 250,
  prefix: null
};

export type InlineCacheContext = {
  set: (key: any, value: any, ttl: CacheOptions["ttl"]) => Promise<void>;
  setError: (
    key: any,
    value: any,
    errorTtl: CacheOptions["errorTtl"]
  ) => Promise<void>;
};

export type CacheOptionsParam = Partial<CacheOptions> | number;

export type RequestCacheFn = (
  /**
   * Data which will be used as the key for caching. Defaults to the full request data.
   * You should only use the the variables from the action handler's `input` parameter
   * which you are using in your script.
   */
  key?: any,
  options?: CacheOptionsParam
) => Promise<void>;

/**
 * An interface to handle translations. An instance of this object
 * will be passed to the `ActionHandlerContext`.
 */
export interface I18nHandler {
  /**
   * Clone the i18n object
   */
  getInstance(): I18nHandler;
  /**
   * Change the language of the current i18n clone
   */
  changeLanguage(language: string): void | Promise<void>;
  /**
   * Translate a string
   */
  t(key: string, defaultValue?: string): string;
}

export interface ActionHandlerContext {
  request: express.Request;
  sig: any;
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
  /**
   * Handle translations. Note that you have to set
   * up the 18n handler yourself.
   */
  i18n: I18nHandler;
  /**
   * Shorthand for i18n.t
   */
  t: I18nHandler["t"];
}

export type ActionHandler<
  InputType = any,
  OutputType = any,
  AddonClass extends BasicAddon = BasicAddon
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
export type ActionHandlers<T extends BasicAddon> = {
  addon: ActionHandler<AddonRequest, AddonResponse, T>;

  repository: ActionHandler<RepositoryRequest, RepositoryResponse, T>;

  directory: ActionHandler<DirectoryRequest, DirectoryResponse, T>;
  item: ActionHandler<ItemRequest, ItemResponse, T>;
  source: ActionHandler<SourceRequest, SourceResponse, T>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse, T>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse, T>;
  captcha: ActionHandler<CaptchaRequest, CaptchaResponse, T>;
};
