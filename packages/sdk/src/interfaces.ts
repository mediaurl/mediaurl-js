import {
  AddonRequest,
  AddonResponse,
  CaptchaRequest,
  CaptchaResponse,
  DirectoryRequest,
  DirectoryResponse,
  IptvRequest,
  IptvResponse,
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
import { CacheHandler, CacheOptionsParam } from "./cache";
import { FetchFn, RecaptchaFn } from "./tasks";

export type RequestCacheFn = (
  /**
   * Data which will be used as the key for caching. You should only use the the
   * variables from the action handlers `input` parameter which you are using in your script.
   * For example: `await ctx.requestCache([input.name, input.year, input.releaseDate]);`
   */
  key: any,
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

  iptv: ActionHandler<IptvRequest, IptvResponse, T>;
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
