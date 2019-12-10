import { getServerValidators } from "@watchedcom/schema";
import * as express from "express";
import * as uuid4 from "uuid/v4";

import { Addon } from "./addon";
import { getCache } from "./cache";
import { debug } from "./common";
import { Context } from "./context";
import { Actions, IContext, IResponse } from "./types";
import { render as renderLandingPage } from "./views";

const decodeBody = (body: object | string) => {
    if (typeof body === "string") return JSON.parse(body);
    if (typeof body === "object") return body;
    return {};
};

class TunnelResponse implements IResponse {
    r: any;

    constructor(r: any) {
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

class HttpContext extends Context {
    req: express.Request;
    res: express.Response;
    resultChannel: string | null;

    constructor(
        addon: Addon,
        action: Actions,
        req: express.Request,
        res: express.Response
    ) {
        super(addon, action);
        this.req = req;
        this.res = res;
        this.resultChannel = null;
    }

    async send(status: number, body: any) {
        if (this.resultChannel) {
            const data = JSON.stringify({ status, body });
            await getCache().set(`task:response:${this.resultChannel}`, data);
        } else {
            this.res.status(status).send(body);
        }
    }

    async fetchRemote(url: string, params: any): Promise<IResponse> {
        // Create and send task
        const id = uuid4();
        const task = {
            id,
            action: "fetch",
            url,
            params
        };
        getServerValidators().task.task(task);
        await getCache().set(`task:wait:${id}`, "1");
        // console.warn('task.create', id);
        await this.send(428, task);

        // Wait for result
        const data = await getCache().waitKey(
            `task:result:${id}`,
            30 * 1000,
            true
        );
        const { resultChannel, result } = JSON.parse(data);
        if (!resultChannel) throw new Error("Missing resultChannel");
        this.resultChannel = resultChannel;
        // console.warn('task.result.get', result.id);
        getServerValidators().task.result(result);
        return new TunnelResponse(result);
    }
}

const validateResponse = (ctx: IContext, status: number, response: any) => {
    if (status == 500) {
        getServerValidators().error(response);
    } else if (status == 428) {
        getServerValidators().task.task(response);
    } else {
        ctx.schema.response(response);
    }
};

const handleTaskResult = async (
    req: express.Request,
    res: express.Response,
    ctx: IContext,
    result: any
) => {
    getServerValidators().task.result(result);

    // Make sure the key exists to prevent spamming
    if (!(await getCache().get(`task:wait:${result.id}`))) {
        throw new Error(`Task wait key ${result.id} does not exists`);
    }
    await getCache().del(`task:wait:${result.id}`);

    // Set the result
    // console.warn('task.result.set', result.id);
    const resultChannel = uuid4();
    const raw = JSON.stringify({ resultChannel, result });
    await getCache().set(`task:result:${result.id}`, raw);

    // Wait for the response
    const data = await getCache().waitKey(`task:response:${resultChannel}`);
    const { status, body: response } = JSON.parse(data);
    validateResponse(ctx, status, response);
    res.status(status).send(response);
};

export function createRouter(addon: Addon): express.Router {
    const router = express.Router();

    router.get("/", (req, res) => {
        if (req.query?.wtchDiscover) {
            res.status(200).send({
                watched: true,
                hasRepository: addon.hasRepository
            });
            return;
        }

        res.send(renderLandingPage(addon));
    });

    router.post("/:action", async (req, res) => {
        const action = req.params.action;

        let ctx = res;
        try {
            ctx = new HttpContext(addon, action, req, res);
            const request = decodeBody(req.body);
            debug(`request: ${addon.id}/${action}: ${JSON.stringify(request)}`);
            if (request.kind === "taskResult") {
                return await handleTaskResult(req, res, ctx, request);
            }

            const response = await ctx.run(request);
            await ctx.send(200, response);
        } catch (error) {
            console.error("error", error.message);
            await ctx.send(500, { error: error.message });
        }
    });

    return router;
}
