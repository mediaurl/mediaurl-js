import * as express from "express";
import * as morgan from "morgan";

import { Addon } from "./addon";
import { debug } from "./common";
import { Context } from "./context";
import { createRouter } from "./router";

export const startServer = (addons: Addon[], port = 3000) => {
    const app = express();

    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    const mount = (addon: Addon, path?: string) => {
        if (!path) path = "/" + addon.id;
        debug(`Mounting ${addon.id} (${addon.type}) on ${path}`);
        app.use(path, createRouter(addon));
    };

    if (addons.length === 1) {
        mount(addons[0], "/");
        mount(addons[0]);
    } else {
        for (const addon of addons) {
            if (addon.type === "repository") mount(addon, "/");
            else mount(addon);
        }
    }

    app.get("/health", (req, res) => res.status(200).send("OK"));

    app.listen(port, () => {
        debug(`Listening on ${port}`);
    });

    return { app };
};

export const startCli = (addons: Addon[], args: any) => {
    const request: any = {};
    for (const arg of args) {
        const m = /^(.*?)=(.*)$/.exec(arg);
        if (!m) throw new Error(`Failed parsing ${arg}`);
        const key = m[1];
        try {
            request[key] = JSON.parse(m[2]);
        } catch (error) {
            request[key] = m[2];
        }
    }
    const addon =
        addons.length === 1
            ? addons[0]
            : addons.find(a => a.id === request.addonId);
    if (!addon) throw new Error(`Addon ${request.addonId} not found`);
    const ctx = new Context(addon, request.action ?? "addon");
    ctx.run(request)
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
};

export function start(addons: Addon[]) {
    const args = [...process.argv];
    args.splice(0, 2);
    if (args[0] === "call") {
        args.splice(0, 1);
        startCli(addons, args);
    } else {
        startServer(addons);
    }
}
