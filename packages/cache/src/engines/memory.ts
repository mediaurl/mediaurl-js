import { BasicCache } from "./basic";

/**
 * In-memory cache, basically for testing
 */
export class MemoryCache extends BasicCache {
  private data: Record<string, [number, string]> = {};

  public async exists(key: string) {
    return (await this.get(key)) !== undefined;
  }

  public async get(key: string) {
    // without this the test case would fail
    await new Promise((r) => setImmediate(r));

    const d = this.data[key];
    if (d) {
      if (d[0] >= Date.now()) {
        return JSON.parse(d[1]);
        // const buffer = await decompressCache(d[1]);
        // return JSON.parse(buffer.toString());
      }
      delete this.data[key];
    }
    return undefined;
  }

  public async set(key: string, value: any, ttl: number) {
    this.data[key] = [
      ttl === Infinity ? Infinity : Date.now() + ttl,
      JSON.stringify(value),
      // await compressCache(Buffer.from(JSON.stringify(value))),
    ];
  }

  public async delete(key: string) {
    delete this.data[key];
  }

  public async deleteAll() {
    this.data = {};
  }

  public async cleanup() {
    for (const key of Object.keys(this.data)) {
      const d = this.data[key];
      if (d && d[0] !== Infinity && d[0] < Date.now()) {
        delete this.data[key];
      }
    }
  }
}
