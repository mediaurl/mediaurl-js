import { BasicCache } from "./BasicCache";
import { createKey } from "./createKey";
import { waitKey } from "./waitKey";

export class LocalCache extends BasicCache {
  private data: any = {};

  public async get(key: any) {
    key = createKey(key);
    const d = this.data[key];
    if (d) {
      if (d[0] >= Date.now()) return d[1];
      delete this.data[key];
    }
    return null;
  }

  public async set(key: any, value: any, ttl = 3600) {
    key = createKey(key);
    this.data[key] = [Date.now() + ttl * 1000, value];
    return value;
  }

  public async delete(key: any) {
    key = createKey(key);
    delete this.data[key];
  }

  public async cleanup() {
    for (const key of Object.keys(this.data)) {
      const d = this.data[key];
      if (d[0] < Date.now()) delete this.data[key];
    }
  }

  public async waitKey(key: any, timeout = 30, del = true): Promise<any> {
    key = createKey(key);
    return waitKey(this, key, timeout * 1000, del, 100);
  }
}
