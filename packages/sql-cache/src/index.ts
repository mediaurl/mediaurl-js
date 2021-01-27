import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import {
  Connection,
  ConnectionOptions,
  createConnection,
  LessThan,
} from "typeorm";
import retryPromise from "promise-retry";

import { CacheItem } from "./CacheItem";

type CreateOptions = Partial<ConnectionOptions & { cleanupInterval: number }>;

const checkTtl = (cacheResult: CacheItem) => {
  if (!cacheResult) {
    return;
  }

  if (cacheResult.d && cacheResult.d < +new Date()) {
    return;
  }

  return cacheResult;
};

const getKey = (key: string) => key.substring(1);

const primaryKey = "k";

export class SqlCache extends BasicCache {
  private connectionP: Promise<Connection>;
  private cleaner;

  constructor(opts: CreateOptions) {
    console.log("creating");
    super();
    this.connectionP = retryPromise((retry) => {
      return createConnection({
        name: `sql-cache-${opts.type}`,
        ...opts,
        synchronize: true,
        entities: [CacheItem],
      } as ConnectionOptions).catch(retry);
    });

    this.cleaner = setInterval(
      () => this.cleanup(),
      opts.cleanupInterval || 1000 * 60 * 60
    );
  }

  async exists(key: string) {
    const c = await this.connectionP;
    return c
      .getRepository(CacheItem)
      .findOne({ k: getKey(key) })
      .then(checkTtl)
      .then((_) => !!_);
  }

  async get(key: string) {
    const c = await this.connectionP;
    return c
      .getRepository(CacheItem)
      .findOne({
        k: getKey(key),
      })
      .then(checkTtl)
      .then((cacheResult) => {
        return cacheResult?.v;
      });
  }

  async set(key: string, value: any, ttl: number) {
    const c = await this.connectionP;

    const item = new CacheItem();
    item.k = getKey(key);
    item.v = value;
    item.d = ttl === Infinity ? null : +new Date(Date.now() + ttl);

    // const result =await c.getRepository(CacheItem).save(item);

    const updateKeys = Object.keys(item).filter((_) => _ !== primaryKey);

    const qb = c
      .createQueryBuilder()
      .insert()
      .into(CacheItem)
      .values(item)
      .orUpdate({
        columns: updateKeys,
        conflict_target: [`"${primaryKey}"`],
      });

    updateKeys.forEach((key) => {
      qb.setParameter(
        key,
        typeof item[key] === "object" && item[key] !== null
          ? JSON.stringify(item[key])
          : item[key]
      );
    });

    await qb.execute();

    return;
  }

  async delete(key: string) {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({ k: getKey(key) });
  }

  async deleteAll() {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({});
  }

  private async cleanup() {
    const c = await this.connectionP;
    await c.getRepository(CacheItem).delete({
      d: LessThan(+new Date()),
    });
  }
}

const allowedTypes: CreateOptions["type"][] = ["postgres", "mysql"];

export const getTypeFromUrl = (url: string) => {
  const type = <CreateOptions["type"]>new URL(url).protocol.replace(/:$/, "");
  if (!allowedTypes.includes(type))
    throw new Error(
      `SQL engine "${type}" not available, use one of ${allowedTypes.join(
        ", "
      )}`
    );
  return type;
};

export const createFromUrl = (url: string, opts?: CreateOptions) => {
  const type = getTypeFromUrl(url);
  return new SqlCache(<CreateOptions>{ type, url, ...opts });
};

registerCacheEngineCreator(() => {
  const url = process.env.SQL_CACHE_URL;
  return url ? createFromUrl(url) : null;
});
