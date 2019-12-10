export class NullCache {
    async get(key) {
        return null;
    }

    async set(key, value) {
        return value;
    }

    async del(key) {}

    async waitKey(key, timeout = 30 * 1000, del = true) {
        const t = new Date().getTime();
        for (;;) {
            const result = await this.get(key);
            if (result) {
                if (del) await this.del(key);
                return result;
            }
            if (new Date().getTime() - t > timeout) {
                throw new Error("Remote request timed out");
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
