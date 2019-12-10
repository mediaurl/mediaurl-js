import redis from "redis";
import { promisify } from "util";

import { NullCache } from "./NullCache";

export class RedisCache extends NullCache {
    constructor(clientConfig) {
        super();
        const client = redis.createClient(clientConfig);
        this.client = {
            get: promisify(client.get).bind(client),
            setex: promisify(client.setex).bind(client),
            del: promisify(client.del).bind(client)
        };
    }

    async get(key) {
        const value = await this.client.get(key);
        if (value) return JSON.parse(value);
        return null;
    }

    async set(key, value, ttl = 24 * 3600) {
        await this.client.setex(key, ttl, JSON.stringify(value));
        return value;
    }

    async del(key) {
        this.client.del(key);
    }
}
