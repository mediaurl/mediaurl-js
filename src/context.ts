import { getServerValidators } from "@watchedcom/schema";
import fetch from "node-fetch";

import { config } from "./config";

export class Context {
    constructor(addonId, action) {
        switch (action) {
            case "addons":
                this.fn = async (ctx, args) =>
                    await Promise.all(
                        Object.values(config.addons)
                            .filter(addon => addon.type !== "repository")
                            .map(addon => addon.infos(ctx, { ...args, index: true }))
                    );
                break;

            case "infos":
            case "directory":
            case "item":
            case "source":
            case "subtitle":
            case "resolve": {
                if (addonId === "repository") addonId = config.repository.id;
                const addon = config.addons[addonId];
                if (!addon) {
                    throw new Error(`Addon ${addonId} not found (requested action ${action})`);
                }
                this.fn = async (ctx, args) => await addon[action](ctx, args);
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        this.action = action;
        this.schema = getServerValidators().actions[action];
        if (!this.schema) throw new Error(`Found no schema for action ${action}`);
    }

    async run(request) {
        this.schema.request(request);
        console.debug(`Calling ${this.action}: ${JSON.stringify(request)}`);
        const response = await this.fn(this, request);
        return this.schema.response(response);
    }

    async fetch(props) {
        return await fetch(props);
    }

    async fetchRemote(props) {
        return await this.fetch(props);
    }
}
