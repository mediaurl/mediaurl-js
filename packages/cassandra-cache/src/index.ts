import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import cassandra, { DseClientOptions } from "cassandra-driver";

export interface CassandraCacheOpts extends DseClientOptions {
  /** default: false */
  synchronize?: boolean;

  /** default: "mediaurl_cache" */
  tableName?: string;
}

export class CassandraCache extends BasicCache {
  private initPromise: Promise<void>;
  private client: cassandra.Client;
  private clientOpts: CassandraCacheOpts;
  private tableName: string;
  private keyspace: string;

  constructor(_opts: string | CassandraCacheOpts) {
    super();

    this.clientOpts =
      typeof _opts === "string"
        ? {
            contactPoints: _opts.split(","),
            localDataCenter: "datacenter1",
            synchronize: true,
          }
        : _opts;

    this.tableName = this.clientOpts.tableName || "mediaurl_cache";
    this.keyspace = this.clientOpts.keyspace || "mediaurl";

    this.client = new cassandra.Client(this.clientOpts);

    this.initPromise = this.client.connect().then(async () => {
      if (this.clientOpts.synchronize) {
        await this.synchronizeSchema();
      }
    });
  }

  public async exists(key: string) {
    await this.initPromise;

    const result = await this.client
      .execute(
        `SELECT key FROM ${this.keyspace}.${this.tableName} WHERE key = ? LIMIT 1`,
        [key]
      )
      .then((d) => d.rows.length > 0);

    return result;
  }

  public async get(key: string) {
    await this.initPromise;

    const value = await this.client
      .execute(
        `SELECT value from ${this.keyspace}.${this.tableName} WHERE key = ?`,
        [key]
      )
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
      INSERT INTO ${this.keyspace}.${this.tableName} (key, value) VALUES (?, ?)
      ${ttl === Infinity ? "" : `USING TTL ${Math.ceil(ttl / 1000)}`}
      `,
      [key, JSON.stringify(value)]
    );
  }

  public async delete(key: string) {
    await this.initPromise;

    await this.client.execute(
      `DELETE FROM ${this.keyspace}.${this.tableName} WHERE key = ?`,
      [key]
    );
  }

  public async deleteAll() {
    await this.initPromise;

    await this.client.execute(`DELETE FROM ${this.keyspace}.${this.tableName}`);
  }

  private async synchronizeSchema() {
    await this.client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace} WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`
    );
    await this.client.execute(
      `
        CREATE TABLE IF NOT EXISTS ${this.keyspace}.${this.tableName}
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
