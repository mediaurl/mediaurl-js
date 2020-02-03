import * as redis from "redis";
import { promisify } from "util";

import { BasicCache } from "./BasicCache";
import { createKey } from "./createKey";
import { waitKey } from "./waitKey";

export class RedisCache extends BasicCache {
  private client: any;

  constructor(clientConfig: redis.ClientOpts) {
    super();
    const redisClient = redis.createClient(clientConfig);
    this.client = {
      get: promisify(redisClient.get).bind(redisClient),
      setex: promisify(redisClient.setex).bind(redisClient),
      del: promisify(redisClient.del).bind(redisClient)
    };
  }

  public async get(key: any) {
    key = createKey(key);
    const value = await this.client.get(key);
    if (value) return JSON.parse(value);
    return null;
  }

  public async set(key: any, value: any, ttl = 3600 * 1000) {
    key = createKey(key);
    await this.client.setex(key, ttl, JSON.stringify(value));
    return value;
  }

  public async delete(key: any) {
    key = createKey(key);
    this.client.del(key);
  }

  public async waitKey(key: any, timeout = 30, del = true): Promise<any> {
    key = createKey(key);
    return waitKey(this, key, timeout, del, 200);
  }
}
