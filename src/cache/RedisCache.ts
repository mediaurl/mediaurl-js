import * as redis from "redis";
import { promisify } from "util";

import { ICache } from "../types/cache";

import { NullCache } from "./NullCache";

export class RedisCache extends NullCache implements ICache {
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

    async get(key: string) {
        const value = await this.client.get(key);
        if (value) return JSON.parse(value);
        return null;
    }

    async set(key: string, value: any, ttl = 24 * 3600) {
        await this.client.setex(key, ttl, JSON.stringify(value));
        return value;
    }

    async del(key: string) {
        this.client.del(key);
    }
}
