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
  SelftestRequest,
  SelftestResponse,
  SourceRequest,
  SourceResponse,
  SubtitleRequest,
  SubtitleResponse,
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
  // All addons
  selftest: ActionHandler<SelftestRequest, SelftestResponse, T>;
  addon: ActionHandler<AddonRequest, AddonResponse, T>;

  // Repository addons
  repository: ActionHandler<RepositoryRequest, RepositoryResponse, T>;

  // Worker addons
  directory: ActionHandler<DirectoryRequest, DirectoryResponse, T>;
  item: ActionHandler<ItemRequest, ItemResponse, T>;
  source: ActionHandler<SourceRequest, SourceResponse, T>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse, T>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse, T>;
  captcha: ActionHandler<CaptchaRequest, CaptchaResponse, T>;

  // IPTV addons
  iptv: ActionHandler<IptvRequest, IptvResponse, T>;
};

/**
 * Server options
 */
export interface IServerOptions {
  /**
   * Cache handler
   */
  cache: CacheHandler;

  /**
   * Write requests to the addon server to a file which can
   * be replayed later. This is very useful for testing or
   * to create test cases.
   */
  requestRecorderPath: null | string;

  /**
   * Whenever the app is in replay mode. This will mock the ctx.fetch function.
   */
  replayMode: boolean;

  /**
   * Middleware functions
   */
  middlewares: {
    /**
     * Called before any initialization.
     * Have to return the input object.
     */
    init: ((
      addon: BasicAddonClass,
      action: string,
      input: any
    ) => Promise<any>)[];
    /**
     * Called immediately before the action handler is called
     * Have to return the input object.
     */
    request: ((
      addon: BasicAddonClass,
      action: string,
      ctx: ActionHandlerContext,
      input: any
    ) => Promise<any>)[];
    /**
     * Called right before the response is sent.
     * Have to return the output object.
     */
    response: ((
      addon: BasicAddonClass,
      action: string,
      ctx: ActionHandlerContext,
      input: any,
      output: any
    ) => Promise<any>)[];
  };
}

export interface IExpressServerOptions extends IServerOptions {
  /**
   * Start the server in single addon mode (default: false)
   */
  singleMode: boolean;

  /**
   * Log HTTP requests (default: true)
   */
  logRequests: boolean;

  /**
   * Express error handler
   */
  errorHandler: express.ErrorRequestHandler;

  /**
   * Listen port
   */
  port: number;

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

/**
 * Function to send the response. This is the abstraction layer between nodejs
 * server engines like express or serverless cloud hosters.
 */
export type SendResponseFn = (statusCode: number, body: any) => Promise<void>;
