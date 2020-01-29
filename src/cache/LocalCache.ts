import { BasicCache } from "./BasicCache";
import { waitKey } from "./waitKey";

export class LocalCache extends BasicCache {
  private data: any = {};

  public async get(key: string) {
    const d = this.data[key];
    if (d) {
      if (d[0] >= Date.now()) return d[1];
      delete this.data[key];
    }
    return null;
  }

  public async set(key: string, value: any, ttl = 3600) {
    this.data[key] = [Date.now() + ttl * 1000, value];
    return value;
  }

  public async delete(key: string) {
    delete this.data[key];
  }

  public async cleanup() {
    for (const key of Object.keys(this.data)) {
      const d = this.data[key];
      if (d[0] < Date.now()) delete this.data[key];
    }
  }

  public async waitKey(key: string, timeout = 30, del = true): Promise<any> {
    return waitKey(this, key, timeout * 1000, del, 100);
  }
}
