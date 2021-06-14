type TTLValue =
  | null
  | number
  | string
  | ((value: any) => null | number | string | Promise<null | number | string>);

export type CacheOptions = {
  /**
   * TTL in milliseconds. When this is a function, the cache value will be
   * passed as parameter. This can be useful to for example set a special TTL on
   * an empty value.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   * You also can use string values like `5m` or `30s`. See
   * https://github.com/zeit/ms for more infos.
   *
   * Default: 1 hour
   */
  ttl: TTLValue;

  /**
   * After this amount of miliseconds, the cache will be refreshed once.
   * This means that the first call to `get` will return `undefined`, even
   * there is a cached value.
   * Next requests will still access the currently cached value.
   *
   * This value should be below `ttl`, and maybe also below `errorTtl`.
   * This functionality can be very useful to prevent race conditions
   * and to maintain a stable and up to date cache database.
   *
   * Default: `null`
   */
  refreshInterval: null | number | string;

  /**
   * Prefix string. Defaults to addon ID.
   *
   * Default: `null`
   */
  prefix: null | string;

  /**
   * Calls to all `get` functions will always return `undefined`. Set is
   * still working normally. This is useful for testing.
   *
   * Default: `false`
   */
  disableGet: boolean;

  /**
   * Context: `setError` - used by `call` and `inline`
   * TTL for errors in milliseconds.
   * When it's a function, the error will be passed as parameter.
   * To disable error caching, set this to `null`.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   *
   * Default: 5 minutes
   */
  errorTtl: TTLValue;

  /**
   * Context: `setError` - used by `call` and `inline`
   * When the current cache is getting refreshed and an error occoured,
   * should this overwrite the current value?
   *
   * Default: `false`
   */
  storeRefreshErrors: boolean;

  /**
   * Context: `call` and `inline`
   * If there is an exception during cache refresh, return the currently
   * cached value. But only if it doesn't have an error.
   *
   * Default: `true`
   */
  fallbackToCachedValue: boolean;

  /**
   * Context: `call` and `inline`
   * To prevent race conditions like two users requesting the same key at
   * the same time, the executing will wait until either the lock is
   * released or a result is written to the key.
   * The timeout should be little more than the usual execution time of
   * the function.
   *
   * To disable this feature, set it to `null`.
   * Set this to a timeout in miliseconds, or to `Infinity`.
   *
   * Default: 30 seconds
   */
  simultanLockTimeout: null | number | string;

  /**
   * Context: `call` and `inline`
   * The `sleep` parameter of the `waitKey` function.
   *
   * Default: 250 milliseconds
   */
  simultanLockTimeoutSleep: number;
};

export type InlineCacheContext = {
  set: (key: any, value: any, ttl: CacheOptions["ttl"]) => Promise<void>;
  setError: (
    key: any,
    value: any,
    errorTtl: CacheOptions["errorTtl"]
  ) => Promise<void>;
};

export type CacheOptionsParam = Partial<CacheOptions>;

export interface CacheEngine {
  exists(key: any): Promise<any>;
  get(key: any): Promise<any>;
  set(key: any, value: any, ttl: number): Promise<void>;
  delete(key: any): Promise<void>;

  /**
   * This function should remove all cached data. Currently this
   * is only used for testing.
   */
  deleteAll(): Promise<void>;

  /**
   * Add cache prefixes and prevent too long cache keys.
   */
  createKey(prefix: CacheOptions["prefix"], key: any): any;

  /**
   * Garbage collector, this function deleted outdated cache entries.
   */
  cleanup(): Promise<void>;
}
