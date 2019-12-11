import { ICache } from "../types/cache";

import { NullCache } from "./NullCache";
import { RedisCache } from "./RedisCache";

const createCache = (): ICache =>
    process.env.REDIS_CACHE
        ? new RedisCache({ url: process.env.REDIS_CACHE })
        : new NullCache();

let cache = createCache();

export const getCache = () => cache;

export const setCache = (c: ICache) => {
    cache = c;
    return cache;
};
