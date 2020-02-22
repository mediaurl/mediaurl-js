import { createHash } from "crypto";
import { CacheForever } from "../interfaces";

export class BasicCache {
  public async exists(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async get(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async set(key: any, value: any, ttl: number | CacheForever) {
    throw new Error(`Not implemented`);
  }

  public async delete(key: any) {
    throw new Error(`Not implemented`);
  }

  public async cleanup() {}

  /**
   * Add cache prefixes and prevent too long cache keys.
   */
  public createKey(prefix: any, key: any) {
    if (typeof key === "string" && key.indexOf(":") === 0) return key;
    const data = prefix ? [prefix, key] : key;
    const str = typeof data === "string" ? data : JSON.stringify(data);
    if (str.length < 40) return ":" + str;
    const hash = createHash("sha256");
    hash.update(str);
    return ":" + hash.digest().toString("base64");
  }
}
