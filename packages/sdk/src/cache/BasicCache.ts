import { CacheForever } from "../interfaces";

export class BasicCache {
  public async exists(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async get(key: any): Promise<any> {
    throw new Error(`Not implemented`);
  }

  public async set(key: any, value: any, ttl: number | CacheForever) {
    throw new Error(`Not implemented`);
  }

  public async delete(key: any) {
    throw new Error(`Not implemented`);
  }

  public async cleanup() {}
}
