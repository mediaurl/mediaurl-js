import { ApiTask, ApiTaskResult } from "@watchedcom/schema/dist/entities";
import * as express from "express";
import * as uuid4 from "uuid/v4";

import { BasicAddon } from "../addons/BasicAddon";

// Dummy value
const cache: any = {};

export type Responder = {
    send: (statusCode: number, body: any) => Promise<void>;
};

export type FetchRemoteFn = (
    url: string,
    params: ApiTask["params"]
) => Promise<any>;

class TunnelResponse {
    r: any;

    constructor(r: ApiTaskResult) {
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

    get headers() {
        return this.r.headers;
    }

    async json() {
        return this.r.json;
    }

    async text() {
        return this.r.text;
    }

    async data() {
        return Buffer.from(this.r.data, "base64");
    }
}

export const createFetchRemote = (responder: Responder) => {
    const fetch: FetchRemoteFn = async (url, params, timeout = 30 * 1000) => {
        const id = uuid4();
        const task: ApiTask = {
            id,
            action: "fetch",
            url,
            params
        };
        // getServerValidators().task.task(task);
        await cache.set(`task.wait:${id}`, "1", timeout * 2);
        await responder.send(200, task);

        // Set responder to an invalid function
        responder.send = (statusCode, body) => {
            throw new Error("A remote task is currently running");
        };

        // Wait for the result
        const data = cache.waitKey(`task.result:${id}`, timeout, true);
        const { resultChannel, result } = JSON.parse(data);
        // getServerValidators().task.result(result);

        // Set new valid responder
        responder.send = async (statusCode, body) => {
            const data = JSON.stringify({ status, body });
            await cache.set(`task.response:${resultChannel}`, data, timeout);
        };

        // Return fetch response
        return new TunnelResponse(result);
    };
    return fetch;
};

export const createTaskResultHandler = (
    addon: BasicAddon,
    timeout = 120 * 1000
) => {
    const handler: express.RequestHandler = async (req, res) => {
        const result: ApiTaskResult = JSON.parse(req.body);
        // getServerValidators().task.result(result);

        // Make sure the key exists to prevent spamming
        if (!(await cache.get(`task.wait:${result.id}`))) {
            throw new Error(`Task wait key ${result.id} does not exists`);
        }
        await cache.del(`task.wait:${result.id}`);

        // Set the result
        // console.warn('task.result.set', result.id);
        const resultChannel = uuid4();
        const raw = JSON.stringify({ resultChannel, result });
        await cache.set(`task.result:${result.id}`, raw);

        // Wait for the response
        const data = await cache.waitKey(
            `task.response:${resultChannel}`,
            timeout,
            true
        );
        const { status, body: response } = JSON.parse(data);
        // TODO: Validate with the correct JSON schema
        // validateResponse(ctx, status, response);
        res.status(status).send(response);
    };
    return handler;
};
