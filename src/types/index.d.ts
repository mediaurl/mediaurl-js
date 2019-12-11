import { RequestInfo, RequestInit, Response } from "node-fetch";

/** Hack around node-fetch Response */
export interface IResponse {
    error: Error;
    status: number;
    url: string;
    headers: object;
    json: () => Promise<any>;
    text: () => Promise<string>;
    data: () => Promise<any>;
}

type FetchFn = (url: RequestInfo, init?: RequestInit) => Promise<IResponse>;

export interface IContext {
    schema: any;

    fetch: FetchFn;
    fetchRemote: FetchFn;
}

export type Actions =
    | "addon"
    | "directory"
    | "item"
    | "source"
    | "subtitle"
    | "resolve";

export type ActionFunction = (ctx: IContext, args: any) => any;
