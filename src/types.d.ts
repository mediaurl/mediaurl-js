export interface IResponse {
    error: Error;
    status: number;
    url: string;
    headers: object;
    json: () => Promise<any>;
    text: () => Promise<string>;
    data: () => Promise<any>;
}

export interface IContext {
    fetch: (url: string, params: any) => Promise<IResponse>;
    fetchRemote: (url: string, params: any) => Promise<IResponse>;
}

export type Actions =
    | "addon"
    | "directory"
    | "item"
    | "source"
    | "subtitle"
    | "resolve";
export type ActionFunction = (ctx: IContext, args: any) => any;
