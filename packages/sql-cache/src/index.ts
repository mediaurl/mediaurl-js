import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import {
  ConnectionOptions,
  createConnection,
  Connection,
  getRepository,
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

  if (cacheResult.d && cacheResult.d < new Date()) {
    return;
  }

  return cacheResult;
};

export class SqlCache extends BasicCache {
  private connectionP: Promise<Connection>;

  constructor(opts: Partial<ConnectionOptions>) {
    super();
    this.connectionP = createConnection({
      ...opts,
      synchronize: true,
      entities: [CacheItem],
    } as ConnectionOptions);
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

    await getRepository(CacheItem).delete({ k: key });
    const item = new CacheItem();
    item.k = key;
    item.v = value;
    item.d = ttl === Infinity ? undefined : new Date(Date.now() + ttl);

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
