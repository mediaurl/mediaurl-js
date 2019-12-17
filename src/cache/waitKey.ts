import { BasicCache } from "./BasicCache";

export const waitKey = async (
    cache: BasicCache,
    key: string,
    timeout: number,
    del: boolean,
    sleep: number
) => {
    const t = Date.now();
    while (true) {
        const result = await cache.get(key);
        if (result) {
            if (del) await cache.delete(key);
            return result;
        }
        if (Date.now() - t > timeout) {
            throw new Error("Remote request timed out");
        }
        await new Promise(resolve => setTimeout(resolve, sleep));
    }
};
