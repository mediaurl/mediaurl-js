import * as mongodb from "mongodb";
import { BasicCache } from "./BasicCache";

const COLLECTION_NAME = "_watched-cache";
const PAYLOAD_FIELD = "c";
/** Expiration date */
const DATE_FIELD = "d";

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
        { expireAfterSeconds: 0 }
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

      const expired = !!(resp?.[DATE_FIELD] < new Date());

      if (expired) {
        return;
      }

      return resp?.[PAYLOAD_FIELD];
    });
  }

  public async set(key, value, ttl) {
    await (await this.collection).updateOne(
      {
        _id: key
      },
      {
        $set: {
          [PAYLOAD_FIELD]: value,
          /** If date field is not type of Date, then it will not be removed */
          [DATE_FIELD]:
            ttl !== Infinity ? new Date(+new Date() + ttl) : undefined
        }
      },
      { upsert: true }
    );
  }

  public async delete(key) {
    await (await this.collection).deleteOne({ _id: key });
  }
}
