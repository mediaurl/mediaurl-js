export * from "./BasicCache";
export * from "./DiskCache";
export * from "./MemoryCache";
export * from "./RedisCache";
export * from "./MongoCache";

export const getCacheEngineFromEnv = () =>
  process.env.DISK_CACHE
    ? new (require("./DiskCache").DiskCache)(process.env.DISK_CACHE)
    : process.env.REDIS_CACHE
    ? new (require("./RedisCache").RedisCache)({ url: process.env.REDIS_CACHE })
    : process.env.MONGO_CACHE
    ? new (require("./MongoCache").MongoCache)(process.env.MONGO_CACHE)
    : new (require("./MemoryCache").MemoryCache)();
