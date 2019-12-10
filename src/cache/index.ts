import { NullCache } from "./NullCache";
import { RedisCache } from "./RedisCache";

export interface ICache {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<any>;
    del(key: string): Promise<void>;
    waitKey(...args: any[]): Promise<any>;
}

export function createCache() {
    return process.env.REDIS_CACHE
        ? new RedisCache({ url: process.env.REDIS_CACHE })
        : new NullCache();
}
