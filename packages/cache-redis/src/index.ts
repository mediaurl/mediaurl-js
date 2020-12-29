import {
  BasicCache,
  compressCache,
  decompressCache,
  registerCacheEngineCreator,
} from "@mediaurl/sdk";
import * as redis from "redis";
import { promisify } from "util";

const getKey = (key: string) => key.substring(1);

export class RedisCache extends BasicCache {
  private client: any;

  constructor(
    clientConfig: redis.ClientOpts,
    private readonly minCompressionValueLength: number | null = 100
  ) {
    super();
    const redisClient = redis.createClient({
      ...clientConfig,
      return_buffers: true,
    });
    this.client = {
      exists: promisify(redisClient.exists).bind(redisClient),
      get: promisify(redisClient.get).bind(redisClient),
      set: promisify(redisClient.set).bind(redisClient),
      psetex: promisify(redisClient.psetex).bind(redisClient),
      del: promisify(redisClient.del).bind(redisClient),
      flushdb: promisify(redisClient.flushdb).bind(redisClient),
      scan: promisify(redisClient.scan).bind(redisClient),
      pttl: promisify(redisClient.pttl).bind(redisClient),
    };
  }

  public async exists(key: string) {
    return await this.client.exists(getKey(key));
  }

  public async get(key: string) {
    const value: Buffer = await this.client.get(getKey(key));
    if (value === null) return undefined;
    const buffer = await decompressCache(value);
    return JSON.parse(buffer.toString());
  }

  public async set(key: string, value: any, ttl: number) {
    const text = JSON.stringify(value);
    const buffer = Buffer.from(text);
    const data =
      this.minCompressionValueLength !== null
        ? await compressCache(
            Buffer.from(buffer),
            this.minCompressionValueLength
          )
        : buffer;
    if (ttl === Infinity) {
      await this.client.set(getKey(key), data);
    } else {
      await this.client.psetex(getKey(key), ttl, data);
    }
  }

  public async delete(key: string) {
    this.client.del(getKey(key));
  }

  public async deleteAll() {
    await this.client.flushdb();
  }

  public async migrateToCompress(prefix: string | null = null) {
    if (this.minCompressionValueLength === null) return;
    let cursor = 0;
    do {
      const [nextCursor, keys] =
        prefix === null
          ? await this.client.scan(cursor)
          : await this.client.scan(cursor, "MATCH", `${prefix}*`);
      console.info(
        `Cursor position ${nextCursor.toString()}, got ${keys.length} keys`
      );
      for (let key of keys) {
        key = (<Buffer>key).toString();
        const ttl = await this.client.pttl(key);
        if (ttl === -2) continue;
        if (ttl !== -1 && ttl < 3600 * 1000) continue;
        const value: Buffer = await this.get(`:${key}`);
        await this.set(`:${key}`, value, ttl === -1 ? Infinity : ttl);
      }
      cursor = parseInt(nextCursor.toString());
    } while (cursor > 0);
  }
}

registerCacheEngineCreator(() =>
  process.env.REDIS_URL ? new RedisCache({ url: process.env.REDIS_URL }) : null
);
