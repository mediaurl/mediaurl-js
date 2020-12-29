import { BasicAddonClass } from "./addons";
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
  addons: BasicAddonClass[];
  updateOptions: (options: Partial<EngineOptions>) => void;
  initialize: () => void;
  createAddonHandler: (addon: BasicAddonClass) => AddonHandlerFn;
};

/**
 * Holder of all addons and it's handler function
 */
export type AddonHandlerFn = (props: {
  action: string;
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
      addon: BasicAddonClass,
      action: string,
      input: any
    ) => Promise<any>)[];
    /**
     * Called immediately before the action handler is called
     * Have to return the input object.
     */
    request?: ((
      addon: BasicAddonClass,
      action: string,
      ctx: ActionHandlerContext,
      input: any
    ) => Promise<any>)[];
    /**
     * Called right before the response is sent.
     * Have to return the output object.
     */
    response?: ((
      addon: BasicAddonClass,
      action: string,
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
export type ActionHandler<
  InputType = any,
  OutputType = any,
  AddonClass extends BasicAddonClass = BasicAddonClass
> = (
  input: InputType,
  context: ActionHandlerContext,
  addon: AddonClass
) => Promise<OutputType>;
