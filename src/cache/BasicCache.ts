export class BasicCache {
    public async get(key: string): Promise<any> {
        throw new Error(`Not implemented`);
    }

    public async set(key: string, value: any, ttl = 3600) {
        throw new Error(`Not implemented`);
    }

    public async delete(key: string) {
        throw new Error(`Not implemented`);
    }

    public async cleanup() {}

    public async waitKey(key: string, timeout = 30, del = true): Promise<any> {
        throw new Error(`Not implemented`);
    }
}
