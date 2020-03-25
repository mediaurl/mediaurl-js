import {
  CacheOptions,
  CacheOptionsParam,
  defaultCacheOptions,
  InlineCacheContext
} from "../interfaces";
import { BasicCache } from "./BasicCache";

/**
 * Internal error which will be raised when the `inline` function had a hit
 */
export class CacheFoundError {
  constructor(public result: any, public error: null | Error) {}
}

export class WaitTimedOut extends Error {}

export class CacheHandler {
  public options: CacheOptions;

  constructor(public readonly engine: BasicCache, options?: CacheOptionsParam) {
    this.options = {
      ...defaultCacheOptions,
      ...options
    };
  }

  public clone(options?: CacheOptionsParam) {
    return new CacheHandler(this.engine, {
      ...this.options,
      ...options
    });
  }

  public setOptions(options: CacheOptionsParam) {
    this.options = {
      ...this.options,
      ...options
    };
  }

  /**
   * Convert the current key to an engine compatible key
   */
  public createKey(key: any) {
    return this.engine.createKey(this.options.prefix, key);
  }

  public async get<T = any>(key: any): Promise<T | undefined> {
    if (this.options.disableGet) return undefined;
    key = this.createKey(key);
    if (this.options.refreshInterval) {
      const locked = await this.engine.get(`${key}-refresh`);
      if (!locked) {
        // Set this key now so the next request will hit the cache again
        await this.engine.set(
          `${key}-refresh`,
          1,
          this.options.refreshInterval
        );
        return undefined;
      }
    }
    return await this.engine.get(key);
  }

  private async _set(key: string, value: any, ttl: number) {
    await this.engine.set(key, value, ttl);
    if (this.options.refreshInterval)
      await this.engine.set(`${key}-refresh`, 1, this.options.refreshInterval);
  }

  public async set(key: any, value: any, ttl?: CacheOptions["ttl"]) {
    key = this.createKey(key);
    if (ttl === undefined) ttl = this.options.ttl;
    if (typeof ttl === "function") ttl = ttl(value);
    if (ttl === null) return;
    await this._set(key, value, ttl);
  }

  public async setError(
    key: any,
    value: any,
    errorTtl?: CacheOptions["errorTtl"]
  ) {
    key = this.createKey(key);
    if (errorTtl === undefined) errorTtl = this.options.errorTtl;
    if (typeof errorTtl === "function") errorTtl = errorTtl(value);
    if (errorTtl === null) return;
    if (this.options.refreshInterval && !this.options.storeRefreshErrors) {
      // Don't store an error if there is still a value set.
      if (await this.engine.exists(key)) return;
    }
    await this._set(key, value, errorTtl);
  }

  public async delete(key: any) {
    key = this.createKey(key);
    await this.engine.delete(key);
  }

  public async cleanup() {
    await this.engine.cleanup();
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
          this.options.simultanLockTimeout,
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

  /**
   * Function which will cache an async function call.
   * Depending on the options, it also will cache exceptions.
   */
  public async call<T = any>(key: any, fn: () => Promise<T>): Promise<T> {
    if (key === null) return await fn();

    key = this.createKey(key);

    let data = await this.get(key);
    if (data === undefined) data = await this.lockRequest(key);

    if (data !== undefined) {
      if (data.error && this.options.errorTtl !== null) {
        throw new Error(data.error);
      } else if (data.result) {
        return data.result;
      }
    }

    if (this.options.simultanLockTimeout) {
      await this.engine.set(
        `${key}-call-lock`,
        1,
        this.options.simultanLockTimeout
      );
    }

    try {
      const result = await fn();
      await this.set(key, { result });
      return result;
    } catch (error) {
      await this.setError(key, { error: error.message || error });
      throw error;
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
   * const data = await cache.get('key');
   * if (data !== undefined) return data;
   * ```
   */
  public async inline(key: any) {
    key = this.createKey(key);

    let data = await this.get(key);
    if (data === undefined) data = await this.lockRequest(key);

    if (data !== undefined) {
      if (data.error && this.options.errorTtl !== null) {
        throw new CacheFoundError(undefined, new Error(data.error));
      } else if (data.result !== undefined) {
        throw new CacheFoundError(data.result, null);
      }
    }

    let releaseLock = async () => {};
    if (this.options.simultanLockTimeout) {
      await this.engine.set(
        `${key}-call-lock`,
        1,
        this.options.simultanLockTimeout
      );
      releaseLock = async () => await this.engine.delete(`${key}-call-lock`);
    }

    return <InlineCacheContext>{
      set: async (result, ttl?: CacheOptions["ttl"]) => {
        await this.set(key, { result }, ttl);
        await releaseLock();
      },
      setError: async (
        error,
        errorTtl: CacheOptions["errorTtl"] | null = null
      ) => {
        await this.setError(key, { error: error?.message || error }, errorTtl);
        await releaseLock();
      }
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
    while (true) {
      const result = await this.get(key);
      if (result !== undefined) {
        if (del) await this.delete(key);
        return result;
      }
      if (timeout !== Infinity && Date.now() - t > timeout) {
        throw new WaitTimedOut("Wait timed out");
      }
      await new Promise(resolve => setTimeout(resolve, sleep));
    }
  }
}
