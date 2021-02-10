import { BasicCache, registerCacheEngineCreator } from "@mediaurl/sdk";
import cassandra from "cassandra-driver";

export class CassandraCache extends BasicCache {
  private initPromise: Promise<void>;
  private client: cassandra.Client;

  constructor(url: string) {
    super();

    this.client = new cassandra.Client({
      contactPoints: url.split(","),
      localDataCenter: "datacenter1",
    });

    this.initPromise = this.client.connect().then(async () => {
      await this.client.execute(
        `CREATE KEYSPACE IF NOT EXISTS mediaurl WITH REPLICATION = {'class': 'SimpleStrategy', 'replication_factor': 1};`
      );
      await this.client.execute(
        `
          CREATE TABLE IF NOT EXISTS mediaurl.cache
          (key TEXT PRIMARY KEY, value TEXT)
          `
      );
    });
  }

  public async exists(key: string) {
    await this.initPromise;

    const result = await this.client
      .execute(`SELECT key FROM mediaurl.cache WHERE key = ? LIMIT 1`, [key])
      .then((d) => d.rows.length > 0);

    return result;
  }

  public async get(key: string) {
    await this.initPromise;

    const value = await this.client
      .execute(`SELECT value from mediaurl.cache WHERE key = ?`, [key])
      .then((result) =>
        result.rowLength > 0 ? JSON.parse(result.rows[0].get("value")) : null
      );

    return value;
  }

  public async set(key: string, value: any, ttl: number) {
    await this.initPromise;

    await this.client.execute(
      `
      INSERT INTO mediaurl.cache (key, value) VALUES (?, ?)
      ${ttl === Infinity ? "" : `USING TTL ${Math.ceil(ttl / 1000)}`}
      `,
      [key, JSON.stringify(value)]
    );
  }

  public async delete(key: string) {
    await this.initPromise;

    await this.client.execute(`DELETE FROM mediaurl.cache WHERE key = ?`, [
      key,
    ]);
  }

  public async deleteAll() {
    await this.initPromise;

    await this.client.execute(`DELETE FROM mediaurl.cache`);
  }
}

registerCacheEngineCreator(() =>
  process.env.CASSANDRA_URL
    ? new CassandraCache(process.env.CASSANDRA_URL)
    : null
);
