export interface ICache<T = any> {
    get(key: string): Promise<T | null>;
    set(key: string, value: T, ttl?: number): Promise<T>;
    del(key: string): Promise<void>;
    waitKey(...args: any[]): Promise<any>;
}
