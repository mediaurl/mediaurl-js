export interface ICache {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<any>;
    del(key: string): Promise<void>;
    waitKey(...args: any[]): Promise<any>;
}
