import * as redis from "redis";
import { promisify } from "util";
import { CacheForever } from "../interfaces";
import { BasicCache } from "./BasicCache";

export class RedisCache extends BasicCache {
  private client: any;

  constructor(clientConfig: redis.ClientOpts) {
    super();
    const redisClient = redis.createClient(clientConfig);
    this.client = {
      exists: promisify(redisClient.exists).bind(redisClient),
      get: promisify(redisClient.get).bind(redisClient),
      set: promisify(redisClient.set).bind(redisClient),
      setex: promisify(redisClient.setex).bind(redisClient),
      del: promisify(redisClient.del).bind(redisClient)
    };
  }

  public async exists(key: string) {
    return await this.client.exists(key);
  }

  public async get(key: string) {
    const value = await this.client.get(key);
    if (value) return JSON.parse(value);
    return undefined;
  }

  public async set(key: string, value: any, ttl: number | CacheForever) {
    if (ttl === "forever") await this.client.setex(key, JSON.stringify(value));
    else await this.client.setex(key, ttl / 1000, JSON.stringify(value));
  }

  public async delete(key: string) {
    this.client.del(key);
  }
}
