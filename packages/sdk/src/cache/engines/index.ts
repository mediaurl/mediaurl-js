import { BasicCache } from "./BasicCache";

export * from "./BasicCache";
export * from "./DiskCache";
export * from "./MemoryCache";

export type CacheEngineCreator = () => BasicCache | null;

const creators: CacheEngineCreator[] = [];

export const registerCacheEngineCreator = (fn: CacheEngineCreator) => {
  creators.push(fn);
};

const defaultCreators = [
  () =>
    process.env.DISK_CACHE
      ? new (require("./DiskCache").DiskCache)(process.env.DISK_CACHE)
      : null,
];

export const detectCacheEngine = (): BasicCache => {
  let engine: BasicCache | null = null;
  for (const fn of creators) {
    engine = fn();
    if (engine) return engine;
  }
  for (const fn of defaultCreators) {
    engine = fn();
    if (engine) return engine;
  }
  return new (require("./MemoryCache").MemoryCache)();
};

for (const module of (process.env.LOAD_MEDIAURL_CACHE_MODULE ?? "").split(
  / +/
)) {
  try {
    require(module);
  } catch (error) {
    throw new Error(
      `Failed loading MediaURL cache module "${module}": ${error.message}`
    );
  }
}
