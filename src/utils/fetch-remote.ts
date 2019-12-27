import {
    getServerValidators,
    ApiTask,
    ApiTaskResult
} from "@watchedcom/schema";
import { EventEmitter } from "events";
import * as express from "express";
import * as uuid4 from "uuid/v4";

import { BasicAddon } from "../addons/BasicAddon";
import { BasicCache } from "../cache/BasicCache";

// export type Responder = {
//     send: (statusCode: number, body: any) => Promise<void>;
//     transport: (statusCode: number, body: any) => Promise<void>;
// };

type TransportFn = (statusCode: number, body: any) => Promise<any>;

export class Responder {
    queue: string[];
    emitter: EventEmitter;
    transport: TransportFn;

    constructor(fn: TransportFn) {
        this.queue = [];
        this.emitter = new EventEmitter();
        this.setTransport(fn);
    }

    async send(statusCode: number, body: any, queueTimeout = 30 * 1000) {
        const id = uuid4();
        this.queue.push(id);
        if (this.queue[0] !== id) {
            console.debug(
                `Queue length ${this.queue.length}, waiting for my turn`
            );
            await new Promise((resolve, reject) => {
                const on = () => {
                    if (this.queue[0] === id) {
                        console.debug("Now it's my turn");
                        this.emitter.removeListener("event", on);
                        resolve();
                    }
                };
                this.emitter.addListener("event", on);
                setTimeout(() => {
                    this.emitter.removeListener("event", on);
                    const i = this.queue.indexOf(id);
                    if (i !== -1) this.queue.splice(i, 1);
                    reject("Waiting for slot timed out");
                }, queueTimeout);
            });
        }
        let res;
        try {
            res = await this.transport(statusCode, body);
        } finally {
            if (this.queue[0] !== id) {
                throw new Error(`First queue element is not the current id`);
            }
            this.queue.shift();
        }
        return res;
    }

    setTransport(fn: TransportFn) {
        this.transport = fn;
        this.emitter.emit("event");
    }
}

export type FetchRemoteFn = (
    url: string,
    params: ApiTask["params"]
) => Promise<TunnelResponse>;

class TunnelResponse {
    constructor(private r: ApiTaskResult) {
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

    async text() {
        return this.r.text;
    }

    async data() {
        return Buffer.from(this.r.data ?? "", "base64");
    }
}

export const createFetchRemote = (responder: Responder, cache: BasicCache) => {
    const fetch: FetchRemoteFn = async (url, params, timeout = 30 * 1000) => {
        const id = uuid4();
        const task: ApiTask = {
            id,
            action: "fetch",
            url,
            params
        };
        // getServerValidators().task.task(task);
        console.debug(`Task ${id} is starting`);
        await cache.set(`task.wait:${id}`, "1", timeout * 2);
        await responder.send(200, task);

        // Wait for the result
        const data: any = await cache.waitKey(
            `task.result:${id}`,
            timeout,
            true
        );
        const { resultChannel, result } = JSON.parse(data);
        // getServerValidators().task.result(result);
        console.debug(`Task ${id} resolved`);

        // Set new valid responder
        responder.setTransport(async (statusCode, body) => {
            const data = JSON.stringify({ statusCode, body });
            await cache.set(`task.response:${resultChannel}`, data, timeout);
        });

        // Return fetch response
        return new TunnelResponse(result);
    };
    return fetch;
};

export const createTaskResultHandler = (
    addon: BasicAddon,
    cache: BasicCache,
    timeout = 120 * 1000
) => {
    const handler: express.RequestHandler = async (req, res) => {
        const result: ApiTaskResult = req.body;
        // getServerValidators().task.result(result);
        console.debug(`Task ${result.id} received response from client`);

        // Make sure the key exists to prevent spamming
        if (!(await cache.get(`task.wait:${result.id}`))) {
            throw new Error(`Task wait key ${result.id} does not exist`);
        }
        await cache.delete(`task.wait:${result.id}`);

        // Set the result
        const resultChannel = uuid4();
        const raw = JSON.stringify({ resultChannel, result });
        await cache.set(`task.result:${result.id}`, raw);

        // Wait for the response
        const data = await cache.waitKey(
            `task.response:${resultChannel}`,
            timeout,
            true
        );
        const { statusCode, body: response } = JSON.parse(data);
        // TODO: Validate with the correct JSON schema
        // validateResponse(ctx, statusCode, response);
        res.status(statusCode).send(response);
        console.debug(`Task ${result.id} sending next response to client`);
    };
    return handler;
};
