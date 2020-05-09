import { cloneDeep } from "lodash";
import { BasicAddonClass } from "./addons";
import { CacheFoundError, CacheHandler, getCacheEngineFromEnv } from "./cache";
import { migrations } from "./migrations";
import {
  createTaskFetch,
  createTaskRecaptcha,
  handleTask,
  Responder,
} from "./tasks";
import {
  ActionHandlerContext,
  AddonHandlerFn,
  AddonHandlerOptions,
} from "./types";
import { RecordData, setupRequestRecorder } from "./utils/request-recorder";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

const defaultOptions: AddonHandlerOptions = {
  cache: new CacheHandler(getCacheEngineFromEnv()),
  requestRecorderPath: null,
  replayMode: false,
  middlewares: {
    init: [],
    request: [],
    response: [],
  },
};

let initialized = false;

/**
 * Initialize the addon and return a `handleAction` function
 */
export const createAddonHandler = (
  options: Partial<AddonHandlerOptions>,
  addon: BasicAddonClass
) => {
  try {
    addon.validateAddon();
  } catch (error) {
    throw new Error(
      `Validation of addon "${addon.getId()}" failed: ${error.message}`
    );
  }

  const opts = {
    ...defaultOptions,
    ...options,
    middlewares: {
      ...defaultOptions.middlewares,
      ...options?.middlewares,
    },
  };

  if (!initialized) {
    console.info(`Using cache: ${opts.cache.engine.constructor.name}`);

    if (opts.requestRecorderPath) {
      setupRequestRecorder(opts.requestRecorderPath);
    }

    initialized = true;
  }

  // return opts;
  const handleAction: AddonHandlerFn = async ({
    action,
    input,
    sig,
    request,
    sendResponse,
  }) => {
    // Run event handlers
    for (const fn of opts.middlewares.init) {
      input = await fn(addon, action, input);
    }

    // Handle task responses
    if (action === "task") {
      await handleTask({
        cache: opts.cache,
        addon,
        input,
        sendResponse,
      });
      return;
    }

    // Get action handler before verifying the signature
    const handler = addon.getActionHandler(action);

    // Validate the signature
    let user: ActionHandlerContext["user"];
    try {
      user =
        process.env.SKIP_AUTH === "1" ||
        action === "selftest" ||
        action === "addon" ||
        (addon.getType() === "repository" && action === "repository")
          ? null
          : validateSignature(sig);
    } catch (error) {
      sendResponse(403, { error: error.message || error });
      return;
    }

    // Migration and input validation
    const migrationContext = {
      addon,
      data: {},
      user,
      validator: getActionValidator(addon.getType(), action),
    };
    try {
      if (migrations[action]?.request) {
        input = migrations[action].request(migrationContext, input);
      } else {
        input = migrationContext.validator.request(input);
      }
    } catch (error) {
      sendResponse(400, { error: error.message || error });
      return;
    }

    // Get a cache handler instance
    const cache = opts.cache.clone({
      prefix: addon.getId(),
      ...addon.getDefaultCacheOptions(),
    });

    // Request cache instance
    let inlineCache: any = null;

    // Store request data for recording
    const record: null | Partial<RecordData> = opts.requestRecorderPath
      ? {}
      : null;
    if (record) {
      record.addon = addon.getId();
      record.action = action;
      record.input = cloneDeep(input);
    }

    // Responder object
    const responder = new Responder(record, sendResponse);

    // Action handler context
    const testMode = opts.replayMode || action === "selftest";
    const ctx: ActionHandlerContext = {
      cache,
      request,
      user,
      requestCache: async (key, options) => {
        if (inlineCache) throw new Error(`Request cache is already set up`);
        const c = cache.clone(options);
        inlineCache = await c.inline(key);
      },
      fetch: createTaskFetch(testMode, responder, cache),
      recaptcha: createTaskRecaptcha(testMode, responder, cache),
    };

    // Run event handlers
    for (const fn of opts.middlewares.request) {
      input = await fn(addon, action, ctx, input);
    }

    // Handle the request
    let statusCode = 200;
    let output: any;
    try {
      output = await handler(input, ctx, addon);

      // Raise default errors
      switch (action) {
        case "resolve":
        case "captcha":
          if (output === null) throw new Error("Nothing found");
          break;
      }

      // Apply migrations
      if (migrations[action]?.response) {
        output = migrations[action].response(migrationContext, input, output);
      } else {
        output = migrationContext.validator.response(output);
      }

      // Handle the requestCache
      if (inlineCache) await inlineCache.set(output);
    } catch (error) {
      // Request cache had a hit
      if (error instanceof CacheFoundError) {
        if (error.result !== undefined) {
          output = error.result;
        } else {
          statusCode = 500;
          output = { error: error.error };
        }
      } else {
        // Handle the requestCache
        if (inlineCache) await inlineCache.setError(error);

        // Set the error
        statusCode = 500;
        output = { error: error.message || error };
        if (!error.noBacktraceLog) console.warn(error);
      }
    }

    // Run event handlers
    for (const fn of opts.middlewares.response) {
      output = await fn(addon, action, ctx, input, output);
    }

    // Send the response
    const id = await responder.send("response", statusCode, output);
    responder.setSendResponse(id, null);
  };

  return handleAction;
};
