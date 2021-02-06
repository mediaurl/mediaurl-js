import { cloneDeep } from "lodash";
import { BasicAddonClass } from "./addons";
import { CacheFoundError, CacheHandler, detectCacheEngine } from "./cache";
import { migrations } from "./migrations";
import {
  createTaskFetch,
  createTaskNotification,
  createTaskRecaptcha,
  createTaskToast,
  handleTask,
  Responder,
} from "./tasks";
import {
  ActionHandlerContext,
  AddonHandlerFn,
  Engine,
  EngineOptions,
  ServerSelftestHandlerFn,
} from "./types";
import { RecordData, RequestRecorder } from "./utils/request-recorder";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

const defaultOptions = {
  requestRecorderPath: null,
  testMode: false,
};

const NoResult = Symbol("no result");

/**
 * Handle options and prepare addons
 */
export const createEngine = (
  addons: BasicAddonClass[],
  options?: Partial<EngineOptions>
): Engine => {
  for (const addon of addons) {
    try {
      addon.validateAddon();
    } catch (error) {
      throw new Error(
        `Validation of addon "${addon.getId()}" failed: ${error.message}`
      );
    }
  }

  const opts: EngineOptions = {
    ...defaultOptions,
    ...options,
    cache: options?.cache ?? new CacheHandler(detectCacheEngine()),
    middlewares: options?.middlewares ?? {},
  };

  let frozen = false;
  let requestRecorder: null | RequestRecorder = null;

  const assertNotFrozen = () => {
    if (frozen) {
      throw new Error(
        "Not allowed to update options after addon handlers are created"
      );
    }
  };

  const initialize = () => {
    assertNotFrozen();

    console.info(`Using cache: ${opts.cache.engine.constructor.name}`);

    if (opts.requestRecorderPath) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "Request recording is not supported in production builds"
        );
      }
      requestRecorder = new RequestRecorder(opts.requestRecorderPath);
      console.warn(`Logging requests to ${requestRecorder.path}`);
    }

    frozen = true;
  };

  return {
    addons,
    updateOptions: (o: Partial<EngineOptions>) => {
      assertNotFrozen();
      Object.assign(opts, o);
    },
    initialize,
    createServerHandler: () => {
      if (!frozen) initialize();
      return createServerHandler(addons);
    },
    createServerSelftestHandler: () => {
      if (!frozen) initialize();
      return createServerSelftestHandler(addons, opts, requestRecorder);
    },
    createAddonHandler: (addon: BasicAddonClass) => {
      if (!frozen) initialize();
      return createAddonHandler(addon, opts, requestRecorder);
    },
    getCacheHandler: () => opts.cache,
  };
};

const createServerHandler = (
  addons: BasicAddonClass[]
): ServerSelftestHandlerFn => async ({ sendResponse }) => {
  sendResponse(200, {
    type: "server",
    addons: addons.map((addon) => addon.getId()),
  });
};

const createServerSelftestHandler = (
  addons: BasicAddonClass[],
  options: EngineOptions,
  requestRecorder: null | RequestRecorder
): ServerSelftestHandlerFn => async ({ request, sendResponse }) => {
  let hasErrors = false;
  const result: Record<string, [number, any]> = {};
  for (const addon of addons) {
    const addonHandler = createAddonHandler(addon, options, requestRecorder);
    try {
      await addonHandler({
        action: "selftest",
        input: {},
        sig: "",
        request,
        sendResponse: async (statusCode, data) => {
          result[addon.getId()] = [statusCode, data];
          if (statusCode !== 200) hasErrors = true;
        },
      });
    } catch (error) {
      result[addon.getId()] = [500, { error: error.message }];
      hasErrors = true;
    }
  }
  sendResponse(hasErrors ? 500 : 200, result);
};

const createAddonHandler = (
  addon: BasicAddonClass,
  options: EngineOptions,
  requestRecorder: null | RequestRecorder
): AddonHandlerFn => async ({ action, input, sig, request, sendResponse }) => {
  // Store input data for recording
  const originalInput = requestRecorder ? cloneDeep(input) : null;

  // Run event handlers
  if (options.middlewares.init) {
    for (const fn of options.middlewares.init) {
      input = await fn(addon, action, input);
    }
  }

  // Handle task responses
  if (input?.kind === "taskResponse" || action === "task") {
    await handleTask({
      cache: options.cache,
      addon,
      input,
      sendResponse,
    });
    return;
  }

  // Get action handler before verifying the signature
  const handler = addon.getActionHandler(action);

  // Check if we are running in test mode
  const testMode = options.testMode || action === "selftest";

  // Validate the signature
  let user: ActionHandlerContext["user"] = null;
  try {
    user = validateSignature(sig);
  } catch (error) {
    const allowInvalidSignature =
      testMode ||
      process.env.SKIP_AUTH === "1" ||
      process.env.NODE_ENV !== "production" ||
      action === "addon" ||
      (addon.getType() === "repository" && action === "repository");
    if (
      !allowInvalidSignature &&
      [
        "Missing MediaURL signature",
        "Invalid MediaURL signature",
        "MediaURL signature timed out",
      ].includes(error.message)
    ) {
      sendResponse(403, { error: error.message || error });
      return;
    }
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
  const cache = options.cache.clone({
    prefix: addon.getId(),
    ...addon.getDefaultCacheOptions(),
  });

  // Request cache instance
  let inlineCache: any = null;

  // Responder object
  const responder = new Responder(sendResponse);

  // Action handler context
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
    toast: createTaskToast(testMode, responder, cache),
    notification: createTaskNotification(testMode, responder, cache),
  };

  // Run event handlers
  if (options.middlewares.request) {
    for (const fn of options.middlewares.request) {
      input = await fn(addon, action, ctx, input);
    }
  }

  // Handle the request
  let statusCode = 200;
  let output: any = NoResult;
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
    if (error instanceof CacheFoundError) {
      // Check if inline cache had a hit
      if (error.result !== undefined) {
        output = error.result;
      }
    } else if (inlineCache) {
      // Set the inline cache
      const newResult = await inlineCache.setError(error);
      if (newResult !== error) {
        output = newResult;
      }
    }

    if (output === NoResult) {
      // Set the error
      statusCode = 500;
      output = { error: error.message || error };
      if (!error.noBacktraceLog) console.warn(error);
    }
  }

  // Run event handlers
  if (options.middlewares.response) {
    for (const fn of options.middlewares.response) {
      output = await fn(addon, action, ctx, input, output);
    }
  }

  // Record
  if (requestRecorder) {
    const record: Partial<RecordData> = {
      addon: addon.getId(),
      action: action,
      input: originalInput,
      output: output,
      statusCode: statusCode,
    };
    await requestRecorder.write(<RecordData>record);
  }

  // Send the response
  const id = await responder.send(statusCode, output);
  responder.setSendResponse(id, null);
};
