import * as redis from "redis";
import { promisify } from "util";

import { BasicCache } from "./BasicCache";
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

  public async get(key: string) {
    const value = await this.client.get(key);
    if (value) return JSON.parse(value);
    return null;
  }

  public async set(key: string, value: any, ttl = 3600 * 1000) {
    await this.client.setex(key, ttl, JSON.stringify(value));
    return value;
  }

  public async delete(key: string) {
    this.client.del(key);
  }

  public async waitKey(key: string, timeout = 30, del = true): Promise<any> {
    return waitKey(this, key, timeout, del, 200);
  }
}
