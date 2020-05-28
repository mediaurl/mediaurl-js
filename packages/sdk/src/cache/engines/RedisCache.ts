import * as redis from "redis";
import { promisify } from "util";
import { BasicCache } from "./BasicCache";
import { compress, decompress } from "./utils/compress";

const getKey = (key: string) => key.substring(1);

export class RedisCache extends BasicCache {
  private client: any;

  constructor(
    clientConfig: redis.ClientOpts,
    private readonly useCompression: boolean = true
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
    };
  }

  public async exists(key: string) {
    return await this.client.exists(getKey(key));
  }

  public async get(key: string) {
    const value: Buffer = await this.client.get(getKey(key));
    if (value === null) return undefined;
    return JSON.parse(await decompress(value));
  }

  public async set(key: string, value: any, ttl: number) {
    const text = JSON.stringify(value);
    const data = this.useCompression ? await compress(text) : text;
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
}
