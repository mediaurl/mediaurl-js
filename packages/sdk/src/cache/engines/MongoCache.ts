import * as mongodb from "mongodb";
import { BasicCache } from "./BasicCache";

// 3 days
const MAX_TTL = 259200000;
const COLLECTION_NAME = "_watched-cache";
const PAYLOAD_FIELD = "c";
const DATE_FIELD = "_d";

export class MongoCache extends BasicCache {
  private collection: Promise<mongodb.Collection>;

  constructor(private url: string, private opts?: mongodb.MongoClientOptions) {
    super();
    this.collection = mongodb.connect(url).then(connection => {
      return connection.db(url.split("/").pop()).collection(COLLECTION_NAME);
    });

    this.collection.then(collection => {
      collection.createIndex(
        {
          [DATE_FIELD]: 1
        },
        { expireAfterSeconds: MAX_TTL }
      );
    });
  }

  public async exists(key: any) {
    return (
      (
        await (await this.collection)
          .find({ _id: key }, { projection: {}, limit: 1 })
          .toArray()
      ).length > 0
    );
  }

  public async get(key) {
    return await (await this.collection).findOne({ _id: key }).then(resp => {
      if (!resp) return;

      const ttlCondition =
        (resp.ttl && new Date(+resp[DATE_FIELD] + resp.ttl) > new Date()) ||
        resp.ttl === undefined;

      return ttlCondition ? resp?.[PAYLOAD_FIELD] : undefined;
    });
  }

  public async set(key, value, ttl) {
    if (ttl > MAX_TTL) {
      console.warn(`Max ttl value is: ${MAX_TTL} ms`);
    }

    await (await this.collection).updateOne(
      {
        _id: key
      },
      {
        $set: {
          ttl,
          [PAYLOAD_FIELD]: value,
          [DATE_FIELD]: new Date()
        }
      },
      { upsert: true }
    );
  }

  public async delete(key) {
    await (await this.collection).deleteOne({ _id: key });
  }
}
