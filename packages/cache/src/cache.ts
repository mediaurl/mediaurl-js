import { createHash } from "crypto";
import { CacheOptions } from "./types";

export class BasicCache {
  public async exists(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async get(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async set(key: any, value: any, ttl: number): Promise<void> {
    throw new Error(`Not implemented`);
  }

  public async delete(key: any): Promise<void> {
    throw new Error(`Not implemented`);
  }

  /**
   * This function should remove all cached data. Currently this
   * is only used for testing.
   */
  public async deleteAll() {}

  /**
   * Add cache prefixes and prevent too long cache keys.
   */
  public createKey(prefix: CacheOptions["prefix"], key: any) {
    if (typeof key === "string" && key.indexOf(":") === 0) return key;
    const str = typeof key === "string" ? key : JSON.stringify(key);
    prefix = prefix === null ? "" : `${prefix}:`;
    const hash = createHash("sha256");
    hash.update(str);
    return ":" + prefix + hash.digest().toString("base64");
  }

  /**
   * Garbage collector, this function deleted outdated cache entries.
   */
  public async cleanup() {}
}
