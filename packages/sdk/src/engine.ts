import { cloneDeep } from "lodash";
import { BasicAddonClass } from "./addons";
import { CacheFoundError } from "./cache";
import {
  ActionHandlerContext,
  IServerOptions,
  RequestCacheFn,
  SendResponseFn,
} from "./interfaces";
import { migrations } from "./migrations";
import {
  createTaskFetch,
  createTaskRecaptcha,
  handleTask,
  Responder,
} from "./tasks";
import { RecordData, setupRequestRecorder } from "./utils/request-recorder";
import { validateSignature } from "./utils/signature";
import { getActionValidator } from "./validators";

/**
 * Make sure the addon as well as the options are initialized
 */
export const initializeAddon = (
  opts: IServerOptions,
  addon: BasicAddonClass
) => {
  try {
    addon.validateAddon();
  } catch (error) {
    throw new Error(
      `Validation of addon "${addon.getId()}" failed: ${error.message}`
    );
  }

  if (opts.requestRecorderPath) {
    setupRequestRecorder(opts.requestRecorderPath);
  }
};

type HandleActionProps = {
  opts: IServerOptions;
  addon: BasicAddonClass;
  action: string;
  input: any;
  sig: string;
  request: any;
  sendResponse: SendResponseFn;
};

/**
 * Handle a addon action request
 */
export const handleAction = async ({
  opts,
  addon,
  action,
  input,
  sig,
  request,
  sendResponse,
}: HandleActionProps) => {
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
  let sigData: any;
  try {
    sigData =
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

  // Migration and validation
  const migrationCtx = {
    addon,
    data: {},
    sigData,
    validator: getActionValidator(addon.getType(), action),
  };
  try {
    if (migrations[action]?.request) {
      input = migrations[action].request(migrationCtx, input);
    } else {
      input = migrationCtx.validator.request(input);
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

  // Request cache helper
  let inlineCache: any = null;
  const requestCache: RequestCacheFn = async (key, options) => {
    if (inlineCache) throw new Error(`Request cache is already set up`);
    const c = cache.clone(options);
    inlineCache = await c.inline(key);
  };

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
    request,
    sig: sigData,
    cache,
    requestCache,
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
      output = migrations[action].response(migrationCtx, input, output);
    } else {
      output = migrationCtx.validator.response(output);
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
