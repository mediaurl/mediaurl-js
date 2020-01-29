import { ApiTaskFetchRequest, ApiTaskFetchResponse } from "@watchedcom/schema";
import * as uuid4 from "uuid/v4";

import { BasicCache } from "../cache";

import { sendTask, Responder } from "./utils";

export type FetchRemoteFn = (
    url: ApiTaskFetchRequest["url"],
    params?: ApiTaskFetchRequest["params"]
) => Promise<TunnelResponse>;

class TunnelResponse {
    constructor(private r: ApiTaskFetchResponse) {
        this.r = r;
    }

    get error() {
        return this.r.error;
    }

    get status() {
        return this.r.status;
    }

    get url() {
        return this.r.url;
    }

    get ok() {
        const status = this.r.status;
        return status >= 200 && status < 300;
    }

    get headers() {
        return this.r.headers;
    }

    async json() {
        return this.r.json;
    }

    async text(): Promise<string> {
        if (!this.r.text) {
            throw new Error("No text in task response");
        }

        return this.r.text;
    }

    async data() {
        if (this.r.data) return Buffer.from(this.r.data, "base64");
        return Buffer.from(<string>this.r.text, "ascii");
    }
}

// export const dummyFetchRemote: FetchRemoteFn = async (url, params) => {
//     const response: ApiTaskFetchResponse = {
//         type: "fetchResponse",
//         id: "",
//         status: 0
//     };
//     try {
//         const res = await fetch(url, params);
//         response.status = res.status;
//         response.url = res.url;
//         response.headers = res.headers;

//         const ct = String(res.headers.get("content-type")).toLowerCase();
//         if (ct.indexOf("application/json") >= 0) {
//             response.json = await res.json();
//         } else if (ct.indexOf("text/") === 0) {
//             response.text = await res.text();
//         } else {
//             throw new Error(
//                 "Dummy fetch return values with binary type is not implemented"
//             );
//         }
//     } catch (error) {
//         response.error = error.message;
//     }
//     return new TunnelResponse(response);
// };

export const createFetchRemote = (responder: Responder, cache: BasicCache) => {
    const fetch: FetchRemoteFn = async (url, params, timeout = 30 * 1000) => {
        const task: ApiTaskFetchRequest = {
            kind: "task",
            type: "fetch",
            id: uuid4(),
            url,
            params
        };
        const response = <ApiTaskFetchResponse>(
            await sendTask(responder, cache, task, timeout)
        );

        // Return fetch response
        const res = new TunnelResponse(response);
        if (res.status === 0) throw new Error(res.error);
        return res;
    };
    return fetch;
};
