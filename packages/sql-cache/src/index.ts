import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import {
  ConnectionOptions,
  createConnection,
  Connection,
  getRepository,
  LessThan,
} from "typeorm";

import { CacheItem } from "./CacheItem";

const ALLOWED_ENV_VARS_MAP: { [envName: string]: ConnectionOptions["type"] } = {
  PG_URL: "postgres",
  MYSQL_URL: "mysql",
};

const checkTtl = (cacheResult: CacheItem) => {
  if (!cacheResult) {
    return;
  }

  if (cacheResult.d && cacheResult.d < +new Date()) {
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
    await this.connectionP;
    return getRepository(CacheItem)
      .findOne({ k: key })
      .then(checkTtl)
      .then((_) => !!_);
  }

  async get(key: string) {
    await this.connectionP;
    return getRepository(CacheItem)
      .findOne({
        k: key,
      })
      .then(checkTtl)
      .then((cacheResult) => {
        return cacheResult?.v;
      });
  }

  async set(key: string, value: any, ttl: number) {
    await this.connectionP;

    const item = new CacheItem();
    item.k = key;
    item.v = value;
    item.d = ttl === Infinity ? undefined : +new Date(Date.now() + ttl);

    await getRepository(CacheItem).save(item);
    return;
  }

  async delete(key: string) {
    await this.connectionP;
    await getRepository(CacheItem).delete({ k: key });
  }

  async deleteAll() {
    await this.connectionP;
    await getRepository(CacheItem).delete({});
  }

  private async cleanup() {
    await getRepository(CacheItem).delete({
      d: LessThan(+new Date()),
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
