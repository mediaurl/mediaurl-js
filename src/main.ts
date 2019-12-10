import * as express from "express";
import * as morgan from "morgan";

import { setupRepository } from "./addon";
import { config, debug } from "./config";
import { Context } from "./context";
import { router } from "./router";

const ensureRepository = () => {
    if (!config.repository) setupRepository();
};

export const startServer = (port = parseInt(process.env.PORT) || 3000) => {
    ensureRepository();

    const app = express();

    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use("/", router);

    app.listen(port, () => {
        debug(`Listening on ${port}`);
    });

    return { app };
};

export const startCli = args => {
    ensureRepository();

    const request = {};
    for (const arg of args) {
        const m = /^(.*?)=(.*)$/.exec(arg);
        const key = m[1];
        try {
            request[key] = JSON.parse(m[2]);
        } catch (error) {
            request[key] = m[2];
        }
    }
    const ctx = new Context(
        request.addonId ?? "repository",
        request.action ?? "infos"
    );
    ctx.run(request)
        .then(result => {
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error(error);
            throw error;
        });
};

export function start() {
    const args = [...process.argv];
    args.splice(0, 2);
    if (args[0] === "call") {
        args.splice(0, 1);
        startCli(args);
    } else {
        startServer();
    }
}
