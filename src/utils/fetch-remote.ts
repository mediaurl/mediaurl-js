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

export const createFetchRemote = (responder: Responder, cache: BasicCache) => {
    const queue: Array<string> = [];
    const emitter = new EventEmitter();

    const fetch: FetchRemoteFn = async (url, params, timeout = 30 * 1000) => {
        const id = uuid4();
        queue.push(id);

        if (queue[0] !== id) {
            console.debug(`Queue length ${queue.length}, waiting for my turn`);
            await new Promise((resolve, reject) => {
                const on = () => {
                    if (queue[0] === id) {
                        console.debug("Now it's my turn");
                        emitter.removeListener("event", on);
                        resolve();
                    }
                };
                emitter.addListener("event", on);
                setTimeout(() => {
                    emitter.removeListener("event", on);
                    reject("Waiting for slot timed out");
                }, timeout);
            });
        }

        try {
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

            // Set responder to an invalid function
            responder.send = (statusCode, body) => {
                throw new Error("A remote task is currently running");
            };

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
            responder.send = async (statusCode, body) => {
                const data = JSON.stringify({ statusCode, body });
                await cache.set(
                    `task.response:${resultChannel}`,
                    data,
                    timeout
                );
            };

            // Return fetch response
            return new TunnelResponse(result);
        } finally {
            if (queue[0] !== id) {
                throw new Error(`First queue element is not the current id`);
            }
            queue.shift();
            emitter.emit("event");
        }
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
            throw new Error(`Task wait key ${result.id} does not exists`);
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
