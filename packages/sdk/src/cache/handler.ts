import ms = require("ms");
import { BasicCache } from "./engines";
import {
  CacheFoundError,
  IgnoreCacheError,
  SetResultError,
  WaitTimedOut,
} from "./errors";
import { CacheOptions, CacheOptionsParam, InlineCacheContext } from "./types";

const defaultCacheOptions: CacheOptions = {
  ttl: ms("1 hour"),
  errorTtl: ms("5 minutes"),
  refreshInterval: null,
  storeRefreshErrors: false,
  fallbackToCachedValue: true,
  simultanLockTimeout: ms("30 seconds"),
  simultanLockTimeoutSleep: 250,
  prefix: null,
  disableGet: false,
};

const mms = (value: number | string) =>
  typeof value === "number" ? value : <number>ms(value);

export class CacheHandler {
  public options: CacheOptions;

  constructor(public readonly engine: BasicCache, options?: CacheOptionsParam) {
    this.options = {
      ...defaultCacheOptions,
      ...options,
    };
  }

  public clone(options?: CacheOptionsParam) {
    return new CacheHandler(this.engine, {
      ...this.options,
      ...options,
    });
  }

  public setOptions(options: CacheOptionsParam) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Convert the current key to an engine compatible key
   */
  public createKey(key: any) {
    return this.engine.createKey(this.options.prefix, key);
  }

  private async _setRefreshKey(key: string) {
    if (this.options.refreshInterval) {
      await this.engine.set(
        `${key}-refresh`,
        1,
        mms(this.options.refreshInterval)
      );
    }
  }

  /**
   * Returns `true` if `key` is cached. Note that with `refreshInterval` enabled,
   * this function can return `true`, and a call to `get` will return an empty
   * result.
   */
  public async exists(key: any) {
    key = this.createKey(key);
    return (await this.engine.exists(key)) ? true : false;
  }

  /**
   * Returns the cached value or, if not found, `undefined`.
   *
   * The `key` parameter can be any value. When this is not a string or it's too long,
   * the value will be hashed.
   *
   * If `updateRefreshInterval` is `true` (default), the refresh interval will be updated.
   * This will prevent concurrent refreshing of the cache.
   * If it's `false`, requests to `get` will always return `undefined` until the cache is
   * updated or `get` is called with `updateRefreshInterval` set to `true`.
   */
  public async get<T = any>(
    key: any,
    updateRefreshInterval = true
  ): Promise<T | undefined> {
    key = this.createKey(key);
    return (await this._get(key, updateRefreshInterval)).value;
  }

  private async _get<T = any>(
    key: string,
    updateRefreshInterval = true,
    ignoreRefresh = false
  ): Promise<{ isRefreshing: boolean; value: T | undefined }> {
    if (this.options.disableGet) {
      return { isRefreshing: false, value: undefined };
    }
    if (!ignoreRefresh && this.options.refreshInterval) {
      const locked = await this.engine.get(`${key}-refresh`);
      if (!locked) {
        if (updateRefreshInterval) {
          // Set this key now so the next request will hit the cache again
          await this._setRefreshKey(key);
        }
        return { isRefreshing: true, value: undefined };
      }
    }
    return { isRefreshing: false, value: await this.engine.get(key) };
  }

  public async set(key: any, value: any, ttl?: CacheOptions["ttl"]) {
    key = this.createKey(key);
    if (ttl === undefined) ttl = this.options.ttl;
    if (typeof ttl === "function") ttl = await ttl(value);
    if (ttl === null) return;
    await this._set(key, value, mms(ttl));
  }

  private async _set(key: string, value: any, ttl: number) {
    await this.engine.set(key, value, ttl);
    await this._setRefreshKey(key);
  }

  /**
   * Force a refresh on the next `get` call.
   */
  public async forceRefresh(key: any) {
    key = this.createKey(key);
    await this.engine.delete(`${key}-refresh`);
  }

  public async delete(key: any) {
    key = this.createKey(key);
    await this.engine.delete(key);
  }

  public async deleteAll() {
    await this.engine.deleteAll();
  }

  /**
   * This function is used for the `call` and `inline` functions.
   * It will set an error value depending on `options.errorTtl` and
   * other settings.
   */
  public async setError(
    key: any,
    value: any,
    errorTtl?: CacheOptions["errorTtl"]
  ) {
    if (IgnoreCacheError instanceof IgnoreCacheError) return;
    key = this.createKey(key);
    if (errorTtl === undefined) errorTtl = this.options.errorTtl;
    if (typeof errorTtl === "function") errorTtl = await errorTtl(value);
    if (errorTtl === null) return;
    if (this.options.refreshInterval && !this.options.storeRefreshErrors) {
      // Store errors only if there is no value set already. We don't want to
      // overwrite a healthy value.
      if (await this.engine.exists(key)) return;
    }
    await this._set(key, value, mms(errorTtl));
  }

  private async lockRequest(key: string) {
    if (this.options.simultanLockTimeout === null) return undefined;
    if (await this.engine.exists(`${key}-call-lock`)) {
      // Wait for a result to be set, instead of the call-lock key.
      // The call-lock key is only used to check if there is a lock
      // active
      try {
        return await this.waitKey(
          key,
          mms(this.options.simultanLockTimeout),
          false,
          this.options.simultanLockTimeoutSleep
        );
      } catch (error) {
        if (error.message !== "Wait timed out") throw error;
        console.warn(`Cache lock timed out`);
        return undefined;
      }
    }
  }

  private async handleCallError(
    key: string,
    isRefreshing: boolean,
    error: Error
  ) {
    if (isRefreshing && this.options.fallbackToCachedValue) {
      const r = await this._get(key, true, true);
      if (r.value !== undefined && r.value.result !== undefined) {
        return r.value.result;
      }
    }
    if (error instanceof SetResultError) {
      await this.set(key, { result: error.forceResult });
      return error.forceResult;
    }
    await this.setError(key, { error: error?.message || error });
    return error;
  }

  /**
   * Function which will cache an async function call.
   * Depending on the options, it also will cache exceptions.
   */
  public async call<T = any>(key: any, fn: () => Promise<T>): Promise<T> {
    if (key === null) return await fn();

    key = this.createKey(key);

    let { isRefreshing, value } = await this._get(key);
    if (value === undefined) value = await this.lockRequest(key);

    if (value !== undefined) {
      if (value.error && this.options.errorTtl !== null) {
        throw new Error(value.error);
      } else if (value.result !== undefined) {
        return value.result;
      }
    }

    if (this.options.simultanLockTimeout) {
      // It *can* happen that two instances will get the lock due to a race condition
      await this.engine.set(
        `${key}-call-lock`,
        1,
        mms(this.options.simultanLockTimeout)
      );
    }

    try {
      const result = await fn();
      await this.set(key, { result });
      return result;
    } catch (error) {
      const newResult = await this.handleCallError(key, isRefreshing, error);
      if (newResult === error) throw error;
      return newResult;
    } finally {
      if (this.options.simultanLockTimeout) {
        await this.engine.delete(`${key}-call-lock`);
      }
    }
  }

  /**
   * This function will throw a `CacheFoundError` exception in case
   * of a cache hit. This exception will be caught by the response
   * handler of an addon action handler.
   *
   * It is basically a shortcut for things like
   * ```
   * const value = await cache.get('key');
   * if (value !== undefined) return value;
   * ```
   */
  public async inline(key: any) {
    key = this.createKey(key);

    let { isRefreshing, value } = await this._get(key);
    if (value === undefined) value = await this.lockRequest(key);

    if (value !== undefined) {
      if (value.error && this.options.errorTtl !== null) {
        throw new CacheFoundError(undefined, new Error(value.error));
      } else if (value.result !== undefined) {
        throw new CacheFoundError(value.result, null);
      }
    }

    let releaseLock = async () => {};
    if (this.options.simultanLockTimeout) {
      await this.engine.set(
        `${key}-call-lock`,
        1,
        mms(this.options.simultanLockTimeout)
      );
      releaseLock = async () => await this.engine.delete(`${key}-call-lock`);
    }

    return <InlineCacheContext>{
      set: async (result) => {
        await this.set(key, { result });
        await releaseLock();
      },
      setError: async (error) => {
        const newResult = await this.handleCallError(key, isRefreshing, error);
        await releaseLock();
        return newResult;
      },
    };
  }

  /**
   * Wait for a key to exists.
   */
  public async waitKey(
    key: any,
    timeout: number = 30 * 1000,
    del = true,
    sleep = 250
  ) {
    key = this.createKey(key);
    const t = Date.now();
    for (;;) {
      const result = await this.get(key);
      if (result !== undefined) {
        if (del) await this.delete(key);
        return result;
      }
      if (timeout !== Infinity && Date.now() - t > timeout) {
        throw new WaitTimedOut("Wait timed out");
      }
      await new Promise((resolve) => setTimeout(resolve, sleep));
    }
  }
}
