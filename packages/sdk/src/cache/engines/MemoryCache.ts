import { BasicCache } from "./BasicCache";

export class MemoryCache extends BasicCache {
  private data: any = {};

  public async exists(key: string) {
    return (await this.get(key)) !== undefined;
  }

  public async get(key: string) {
    const d = this.data[key];
    if (d) {
      if (d[0] === -1 || d[0] >= Date.now()) return d[1];
      delete this.data[key];
    }
    return undefined;
  }

  public async set(key: string, value: any, ttl: number) {
    this.data[key] = [ttl === Infinity ? -1 : Date.now() + ttl, value];
    return value;
  }

  public async delete(key: string) {
    delete this.data[key];
  }

  public async deleteAll() {
    this.data = {};
  }
}
