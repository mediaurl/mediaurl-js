import { WorkerAddon } from "@watchedcom/schema/dist/entities";
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

export type Actions = WorkerAddon["resources"][0]["actions"][0];

export type ActionFunction = (ctx: IContext, args: any) => any;
