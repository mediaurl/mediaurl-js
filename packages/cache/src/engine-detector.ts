import { CacheEngine } from "./types";

export type CacheEngineCreator = () => CacheEngine | null;

const creators: CacheEngineCreator[] = [];

export const registerCacheEngineCreator = (fn: CacheEngineCreator) => {
  creators.push(fn);
};

const defaultCreators = [
  () =>
    process.env.DISK_CACHE
      ? new (require("./engines/disk").DiskCache)(process.env.DISK_CACHE)
      : null,
];

const initialized = false;

export const detectCacheEngine = (): CacheEngine => {
  if (!initialized) {
    // Load modules defined by environment. Do it here to prevent circular imports
    (process.env.LOAD_MEDIAURL_CACHE_MODULE ?? "")
      .split(/ +/)
      .map((module) => module.replace(/ +/g, ""))
      .filter((module) => module)
      .forEach((module) => {
        try {
          require(module);
        } catch (error) {
          throw new Error(
            `Failed loading MediaURL cache module "${module}": ${error.message}`
          );
        }
      });
  }

  let engine: CacheEngine | null = null;
  for (const fn of creators) {
    engine = fn();
    if (engine) return engine;
  }
  for (const fn of defaultCreators) {
    engine = fn();
    if (engine) return engine;
  }
  return new (require("./engines/memory").MemoryCache)();
};
