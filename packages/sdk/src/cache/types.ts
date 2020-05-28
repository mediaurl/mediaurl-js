export type CacheOptions = {
  /**
   * TTL in milliseconds. When this is
   * a function, the cache value will be passed as parameter.
   * This can be useful to for example set a special TTL on
   * an empty value.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   * You also can use string values like `5m` or `30s`. See
   * https://github.com/zeit/ms for more infos.
   *
   * Default: 1 hour
   */
  ttl: null | number | string | ((value: any) => null | number | string);

  /**
   * TTL for errors in milliseconds.
   * When it's a function, the error will be passed as parameter.
   * To disable error caching, set this to `null`.
   * To disable caching, set this to `null`.
   * To cache forever, set this to `Infinity`.
   *
   * Default: 5 minutes
   */
  errorTtl: null | number | string | ((error: any) => null | number | string);

  /**
   * After this amount of miliseconds, the cache will be refreshed once.
   * Next requests will still access the currently cached value.
   * This value should be below `ttl`, and maybe also below `errorTtl`.
   * This functionality can be very useful to prevent race conditions
   * and to maintain a stable cache database.
   *
   * Default: `null`
   */
  refreshInterval: null | number | string;

  /**
   * When the current cache is getting refreshed and an error occoured,
   * should this overwrite the current value?
   *
   * Default: `false`
   */
  storeRefreshErrors: boolean;

  /**
   * This option is for the `call` function.
   * If there is an exception during cache refresh, return the currently
   * cache value. But only if it doesn't have an error.
   *
   * Default: `true`
   */
  fallbackToCachedValue: boolean;

  /**
   * This option is for the `call` and `inline` functions.
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
   * The `sleep` parameter of the `waitKey` function.
   *
   * Default: 250 milliseconds
   */
  simultanLockTimeoutSleep: number;

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
