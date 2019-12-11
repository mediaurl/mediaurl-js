import { ICache } from "../types/cache";

import { NullCache } from "./NullCache";
import { RedisCache } from "./RedisCache";

export const createCache = <T = any>(): ICache<T> =>
    process.env.REDIS_CACHE
        ? new RedisCache<T>({ url: process.env.REDIS_CACHE })
        : new NullCache<T>();

let cache = createCache();

export const getCache = () => cache;

export const setCache = (c: ICache) => {
    cache = c;
    return cache;
};
