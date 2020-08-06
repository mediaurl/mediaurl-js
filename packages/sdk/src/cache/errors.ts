/**
 * Context: `call` and `inline`
 * Errors inherited by this class are not cached.
 */
export class IgnoreCacheError extends Error {}

/**
 * Context: `call` and `inline`
 * The property `forceResult` will be treated as the normal return value
 * of an API function. This also can be used for `CacheHandler` functions
 * `call` and `inline`.
 */
export class SetResultError<T> extends Error {
  constructor(public forceResult: T) {
    super("SetResultError");
  }
}

/**
 * Error thrown by the `CacheHandler.waitKey` function.
 */
export class WaitTimedOut extends IgnoreCacheError {}

/**
 * Context: `inline`
 * Internal error which will be raised when the `CacheHandler.inline`
 * function had a hit.
 */
export class CacheFoundError {
  constructor(public result: any, public error: null | Error) {}
}
