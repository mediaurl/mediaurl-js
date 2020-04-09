/**
 * Errors inherited by this class are not cached.
 */
export class IgnoreCacheError extends Error {}

/**
 * Error thrown by the `CacheHandler.waitKey` function.
 */
export class WaitTimedOut extends IgnoreCacheError {}

/**
 * Internal error which will be raised when the `CacheHandler.inline` function had a hit.
 */
export class CacheFoundError {
  constructor(public result: any, public error: null | Error) {}
}
