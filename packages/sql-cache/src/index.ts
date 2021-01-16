import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import {
  Connection,
  ConnectionOptions,
  createConnection,
  LessThan,
} from "typeorm";
import { CacheItem } from "./CacheItem";

export const ALLOWED_ENV_VARS_MAP: {
  [envName: string]: ConnectionOptions["type"];
} = {
  POSTGRES_URL: "postgres",
  MYSQL_URL: "mysql",
};

const checkTtl = (cacheResult: CacheItem) => {
  if (!cacheResult) {
    return;
  }

  if (cacheResult.d && cacheResult.d < new Date()) {
    return;
  }

  return cacheResult;
};

export class SqlCache extends BasicCache {
  private connectionP: Promise<Connection>;
  private cleaner;

  constructor(opts: Partial<ConnectionOptions & { cleanupInterval: number }>) {
    super();
    this.connectionP = createConnection({
      name: `sql-cache-${opts.type}`,
      ...opts,
      synchronize: true,
      entities: [CacheItem],
    } as ConnectionOptions);

    this.cleaner = setInterval(
      () => this.cleanup(),
      opts.cleanupInterval || 1000 * 60 * 60
    );
  }

  async exists(key: string) {
    const c = await this.connectionP;
    return c
      .getRepository(CacheItem)
      .findOne({ k: key })
      .then(checkTtl)
      .then((_) => !!_);
  }

  async get(key: string) {
    const c = await this.connectionP;
    return c
      .getRepository(CacheItem)
      .findOne({
        k: key,
      })
      .then(checkTtl)
      .then((cacheResult) => {
        return cacheResult?.v;
      });
  }

  async set(key: string, value: any, ttl: number) {
    const c = await this.connectionP;

    const item = new CacheItem();
    item.k = key;
    item.v = value;
    item.d = ttl === Infinity ? undefined : new Date(Date.now() + ttl);

    await c.getRepository(CacheItem).save(item);
    return;
  }

  async delete(key: string) {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({ k: key });
  }

  async deleteAll() {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({});
  }

  private async cleanup() {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({
      d: LessThan(new Date()),
    });
  }
}

registerCacheEngineCreator(() => {
  const connectionVar = Object.keys(ALLOWED_ENV_VARS_MAP).find(
    (envVar) => process.env[envVar]
  );

  return connectionVar
    ? new SqlCache({
        type: ALLOWED_ENV_VARS_MAP[connectionVar],
        url: process.env[connectionVar],
      })
    : null;
});
