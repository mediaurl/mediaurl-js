import { compressCache, decompressCache } from "../utils/compress";
import { BasicCache } from "./BasicCache";

/**
 * In-memory cache, basically for testing
 */
export class MemoryCache extends BasicCache {
  private data: Record<string, [number, Buffer]> = {};

  public async exists(key: string) {
    return (await this.get(key)) !== undefined;
  }

  public async get(key: string) {
    const d = this.data[key];
    if (d) {
      if (d[0] >= Date.now()) {
        const buffer = await decompressCache(d[1]);
        return JSON.parse(buffer.toString());
      }
      delete this.data[key];
    }
    return undefined;
  }

  public async set(key: string, value: any, ttl: number) {
    this.data[key] = [
      ttl === Infinity ? Infinity : Date.now() + ttl,
      await compressCache(Buffer.from(JSON.stringify(value))),
    ];
  }

  public async delete(key: string) {
    delete this.data[key];
  }

  public async deleteAll() {
    this.data = {};
  }
}
