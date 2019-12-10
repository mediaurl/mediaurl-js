import debugModule from "debug";

import { createCache } from "./cache";

export const debug = debugModule("watched:sdk");

class Config {
    cache = createCache();
    repository = null;
    addons = {};

    setCache(cache) {
        this.cache = cache;
    }

    registerAddon(addon) {
        if (addon.id === "addons") {
            throw new Error(`Addon ID ${addon.id} for ${addon.type} is forbidden`);
        }
        if (this.addons[addon.id]) {
            throw new Error(`Addon ${addon.id} already exists`);
        }
        if (addon.type === "repository") {
            if (this.repository) throw new Error("Repository already set");
            this.repository = addon;
        }
        this.addons[addon.id] = addon;
    }
}

export const config = new Config();

export const setCache = config.setCache;
