import {
  AddonActions,
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
  ResolvedUrl,
  ResolveRequest,
  ResolveResponse,
  SelftestRequest,
  SelftestResponse,
  SourceRequest,
  SourceResponse,
  SubtitleRequest,
  SubtitleResponse,
} from "@mediaurl/schema";
import { AddonClass } from "./addon";
import { CacheHandler, CacheOptionsParam } from "./cache";
import { FetchFn, NotificationFn, RecaptchaFn, ToastFn } from "./tasks";

/**
 * Some infos about the current request.
 */
export type RequestInfos = {
  /**
   * This may *not* be the real client IP, especially if this service is
   * running behind a load balancer or reverse proxy.
   */
  ip: string;

  /**
   * HTTP headers. Header keys should be in lower case.
   */
  headers: Record<string, string>;
};

/**
 * Function to send the response. This is the abstraction layer between nodejs
 * server engines like express or serverless cloud hosters.
 */
export type SendResponseFn = (statusCode: number, body: any) => Promise<void>;

/**
 * The engine object
 */
export type Engine = {
  addons: AddonClass[];
  updateOptions: (options: Partial<EngineOptions>) => void;
  initialize: () => void;
  createServerHandler: () => ServerHandlerFn;
  createServerSelftestHandler: () => ServerSelftestHandlerFn;
  createAddonHandler: (addon: AddonClass) => AddonHandlerFn;
  getCacheHandler: () => CacheHandler;
};

/**
 * Server handler function
 */
export type ServerHandlerFn = (props: {
  sendResponse: SendResponseFn;
}) => Promise<void>;

/**
 * Selftest handler function
 */
export type ServerSelftestHandlerFn = (props: {
  request: RequestInfos;
  sendResponse: SendResponseFn;
}) => Promise<void>;

/**
 * Addon handler function
 */
export type AddonHandlerFn = (props: {
  action: AddonActions;
  request: RequestInfos;
  sig: string;
  input: any;
  sendResponse: SendResponseFn;
}) => Promise<void>;

/**
 * Addon engine options
 */
export type EngineOptions = {
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
   * Whenever the app is in test mode. This will mock the ctx.fetch
   * function and skip authentication.
   */
  testMode: boolean;

  /**
   * Middleware functions
   */
  middlewares: {
    /**
     * Called before any initialization.
     * Have to return the input object.
     */
    init?: ((
      addon: AddonClass,
      action: AddonActions,
      input: any
    ) => Promise<any>)[];
    /**
     * Called immediately before the action handler is called
     * Have to return the input object.
     */
    request?: ((
      addon: AddonClass,
      action: AddonActions,
      ctx: ActionHandlerContext,
      input: any
    ) => Promise<any>)[];
    /**
     * Called right before the response is sent.
     * Have to return the output object.
     */
    response?: ((
      addon: AddonClass,
      action: AddonActions,
      ctx: ActionHandlerContext,
      input: any,
      output: any
    ) => Promise<any>)[];
  };
};

/**
 * Context of the action call. This object also holds tools like
 * the `cache` property, the remote `fetch` method or `recaptcha`.
 */
export interface ActionHandlerContext {
  /**
   * Cache handler instance
   */
  cache: CacheHandler;

  /**
   * Infos about the request
   */
  request: RequestInfos;

  /**
   * User data
   */
  user: null | {
    /**
     * Current timestamp in miliseconds
     */
    time: number;

    /**
     * Timestamp until when this signed object is valid
     */
    validUntil: number;

    /**
     * Anonymized user ID
     */
    user: string;

    /**
     * User status
     */
    status: "guest" | "free" | "pro";

    /**
     * Indicator if the user is verified (deprecated)
     */
    verified: boolean;

    /**
     * Allowed client IP's
     */
    ips: string[];

    /**
     * In case of an error, this is the message
     */
    error?: string;

    /**
     * Informations about the currently used client app
     */
    app: {
      /**
       * Name of the app
       */
      name: string;

      /**
       * Version
       */
      version: string;

      /**
       * Platform
       */
      platform: string;

      /**
       * If everything is fine, this is set to `true`. If it's `false`,
       * you can raise an error
       */
      ok: boolean;
    };
  };

  /**
   * Helper function to cache full action calls. Run this
   * on the beginning of your action handler to check
   * if the request is cached already.
   * If there is a cache hit, the request will be aborted
   * automatically.
   */
  requestCache: (
    /**
     * Data which will be used as the key for caching. You should only use the the
     * variables from the action handlers `input` parameter which you are using in your script.
     * For example: `await ctx.requestCache([input.name, input.year, input.releaseDate]);`
     */
    key: any,
    options?: CacheOptionsParam
  ) => Promise<void>;

  /**
   * Fetch an URL via the client app.
   */
  fetch: FetchFn;

  /**
   * Solve a recaptcha via the client app.
   */
  recaptcha: RecaptchaFn;

  /**
   * Show a toast message inside the app.
   */
  toast: ToastFn;

  /**
   * Show a notification inside the app.
   */
  notification: NotificationFn;
}

/**
 * Action handler function
 */
type ActionHandler<InputType = any, OutputType = any> = (
  input: InputType,
  context: ActionHandlerContext,
  addon: AddonClass
) => Promise<OutputType>;

/**
 * Should include all available handlers.
 * It's base type to pick from (by action).
 */
export type ActionHandlers = {
  selftest: ActionHandler<SelftestRequest, SelftestResponse>;
  addon: ActionHandler<AddonRequest, AddonResponse>;
  repository: ActionHandler<RepositoryRequest, RepositoryResponse>;
  directory: ActionHandler<DirectoryRequest, DirectoryResponse>;
  item: ActionHandler<ItemRequest, ItemResponse>;
  source: ActionHandler<SourceRequest, SourceResponse>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse>;
  captcha: ActionHandler<CaptchaRequest, CaptchaResponse>;
  iptv: ActionHandler<IptvRequest, IptvResponse>;
};

/**
 * Resolve handler function used for `AddonClass.addResolveHandler`.
 */
export type ResolverHandlerFn = (
  match: RegExpExecArray,
  input: ResolveRequest,
  ctx: ActionHandlerContext
) => Promise<ResolveResponse>;
