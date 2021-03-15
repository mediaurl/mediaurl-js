import { BasicCache, registerCacheEngineCreator } from "@mediaurl/cache";
import cassandra, { DseClientOptions } from "cassandra-driver";

export interface CassandraCacheOpts extends DseClientOptions {
  /** default: false */
  synchronize?: boolean;

  /** default: "mediaurl_cache" */
  tableName?: string;
}

const defaultOpts = {
  keyspace: "mediaurl",
  tableName: "mediaurl_cache",
  localDataCenter: "datacenter1",
  synchronize: true,
};

const getKey = (key: string) => key.substring(1);

export class CassandraCache extends BasicCache {
  private client: cassandra.Client;
  private initPromise: Promise<void>;
  private keyspace: string;
  private tableName: string;

  constructor(_opts: string | CassandraCacheOpts) {
    super();

    if (typeof _opts === "string") {
      _opts = {
        contactPoints: _opts.split(","),
      };
    }

    const {
      tableName,
      /**
       * Cassandra driver will throw connection error if keyspace doesn't exist.
       * We might want to syncronize it, so deleting from opts
       */
      keyspace,
      ...clientOpts
    } = {
      ...defaultOpts,
      ..._opts,
    };

    this.keyspace = keyspace;
    this.tableName = `${keyspace}.${tableName}`;

    this.client = new cassandra.Client(clientOpts);

    this.initPromise = this.client.connect().then(async () => {
      if (clientOpts.synchronize) {
        await this.synchronizeSchema();
      }
    });
  }

  public async exists(key: string) {
    await this.initPromise;

    const result = await this.client
      .execute(`SELECT key FROM ${this.tableName} WHERE key = ? LIMIT 1`, [
        getKey(key),
      ])
      .then((d) => d.rows.length > 0);

    return result;
  }

  public async get(key: string) {
    await this.initPromise;

    const value = await this.client
      .execute(`SELECT value from ${this.tableName} WHERE key = ?`, [
        getKey(key),
      ])
      .then((result) =>
        result.rowLength > 0
          ? JSON.parse(result.rows[0].get("value"))
          : undefined
      );

    return value;
  }

  public async set(key: string, value: any, ttl: number) {
    await this.initPromise;

    await this.client.execute(
      `
      INSERT INTO ${this.tableName} (key, value) VALUES (?, ?)
      ${ttl === Infinity ? "" : `USING TTL ${Math.ceil(ttl / 1000)}`}
      `,
      [getKey(key), JSON.stringify(value)]
    );
  }

  public async delete(key: string) {
    await this.initPromise;

    await this.client.execute(`DELETE FROM ${this.tableName} WHERE key = ?`, [
      getKey(key),
    ]);
  }

  public async deleteAll() {
    await this.initPromise;

    await this.client.execute(`TRUNCATE TABLE ${this.tableName}`);
  }

  private async synchronizeSchema() {
    await this.client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace}
      WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`
    );
    await this.client.execute(
      `
        CREATE TABLE IF NOT EXISTS ${this.tableName}
        (key TEXT PRIMARY KEY, value TEXT)
        `
    );
  }
}

registerCacheEngineCreator(() => {
  const configPayload = process.env.CASSANDRA_CONFIG;

  if (!configPayload) return null;

  /** Assuming it's plain connection url */
  let config = configPayload;

  try {
    config = JSON.parse(configPayload);
  } catch {
    /** do nothing */
  }

  return new CassandraCache(config);
});
