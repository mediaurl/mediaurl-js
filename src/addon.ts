import { getServerValidators } from "@watchedcom/schema";
import {
    Addon as AddonType,
    ApiAddonRequest,
    ApiAddonResponse,
    RepositoryAddon as RepositoryAddonType
} from "@watchedcom/schema/dist/entities";
import * as appRootPath from "app-root-path";
import { cloneDeep } from "lodash";

import { getCache } from "./cache";
import { Context } from "./context";
import { Actions, ActionFunction } from "./types";

const rootPackage = appRootPath.require("./package");

const defaults = {
    id: rootPackage.name,
    name: rootPackage.description ?? rootPackage.name,
    version: rootPackage.version ?? "0.0.0",
    homepage: rootPackage.homepage || rootPackage.repository
};

const hardCopy = cloneDeep;

export class Addon {
    props: AddonType;
    hasRepository: boolean = false;

    constructor(props: AddonType) {
        this.props = getServerValidators().models.addon({
            type: "worker",
            id: `${defaults.id}.${props.type}`,
            name: defaults.name,
            version: defaults.version,
            homepage: defaults.homepage,
            ...props
        });
    }

    get id() {
        return this.props.id;
    }

    get type() {
        return this.props.type;
    }

    async cacheGet(key: string) {
        return getCache().get(`${this.id}/${key}`);
    }

    async cacheSet(key: string, value: any, ttl = 24 * 3600) {
        return getCache().set(`${this.id}/${key}`, value, ttl);
    }

    async cacheDel(key: string) {
        return getCache().del(`${this.id}/${key}`);
    }

    async addon(
        ctx: Context,
        args: ApiAddonRequest
    ): Promise<ApiAddonResponse> {
        return hardCopy(this.props);
    }

    async directory(ctx: Context, args: any) {
        throw new Error("Not implemented");
    }

    async item(ctx: Context, args: any) {
        throw new Error("Not implemented");
    }

    async source(ctx: Context, args: any) {
        throw new Error("Not implemented");
    }

    async subtitle(ctx: Context, args: any) {
        throw new Error("Not implemented");
    }

    async resolve(ctx: Context, args: any) {
        throw new Error("Not implemented");
    }
}

export function createAddon(props: AddonType): Addon {
    class MyAddon extends Addon {
        on(action: Actions, fn: ActionFunction) {
            this[action] = fn.bind(this);
            return this;
        }
    }

    return new MyAddon(props);
}

export class Repository extends Addon {
    props: RepositoryAddonType;
    addons: Addon[];

    constructor(props: RepositoryAddonType) {
        super({ ...props, type: "repository" });
        this.addons = [this];
    }

    register(addon: Addon) {
        addon.hasRepository = true;
        this.addons.push(addon);
    }

    async addon(ctx: Context, args: any): Promise<ApiAddonResponse> {
        const props = await super.addon(ctx, args);
        if (!args.index) {
            args.index = true;
            props.addons = [];
            for (const addon of this.addons) {
                if (addon !== this) {
                    const p = await addon.addon(ctx, args);
                    p.metadata = { url: "./" + addon.id };
                    props.addons.push(p);
                }
            }
        }
        return props;
    }
}

export function createRepository(props: RepositoryAddonType) {
    return new Repository(props);
}
