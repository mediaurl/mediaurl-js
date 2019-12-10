import { NullCache } from "./NullCache";
import { RedisCache } from "./RedisCache";

export function createCache() {
    return process.env.REDIS_CACHE
        ? new RedisCache({ url: process.env.REDIS_CACHE })
        : new NullCache();
}
