import { createHash } from "crypto";
import { CacheEngine, CacheOptions } from "../types";

export class BasicCache implements CacheEngine {
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

  public async deleteAll() {}

  public createKey(prefix: CacheOptions["prefix"], key: any) {
    if (typeof key === "string" && key.indexOf(":") === 0) return key;
    const str = typeof key === "string" ? key : JSON.stringify(key);
    prefix = prefix === null ? "" : `${prefix}:`;
    const hash = createHash("sha256");
    hash.update(str);
    return ":" + prefix + hash.digest().toString("base64");
  }

  public async cleanup() {}
}
