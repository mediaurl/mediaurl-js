import {
    Addon as AddonProps,
    ApiAddonRequest,
    ApiRepositoryRequest,
    RepositoryAddon as RepositoryAddonProps,
    RepositoryAddonActions
} from "@watchedcom/schema";
import fetch from "node-fetch";

import { ActionHandlers, ActionHandlerContext } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";
import { validateAddonProps } from "../validators";

import { BasicAddon } from "./BasicAddon";

export type RepositoryHandlers = Pick<
    ActionHandlers<RepositoryAddon>,
    RepositoryAddonActions
>;

type Url = string;

export class RepositoryAddon extends BasicAddon<
    RepositoryHandlers,
    RepositoryAddonProps
> {
    private addons: BasicAddon[] = [];
    private urls: Url[] = [];

    constructor(p: RepositoryAddonProps) {
        super(p);

        this.registerActionHandler(
            "repository",
            async (args: ApiRepositoryRequest, ctx: ActionHandlerContext) => {
                return this.getAllAddonProps(args, ctx);
            }
        );
    }

    public async getAllAddonProps(
        args: ApiAddonRequest,
        ctx: ActionHandlerContext
    ) {
        const result: AddonProps[] = [];
        const promises: Promise<void>[] = [];

        for (const addon of this.addons) {
            const fn = async () => {
                const id = addon.getId();
                try {
                    const handler = addon.getActionHandler("addon");
                    const props: AddonProps = await handler(
                        { ...args },
                        { ...ctx, addon }
                    );
                    props.metadata = { url: `'./${id}` };
                    result.push(props);
                } catch (error) {
                    console.warn(`Failed loading ${id}:`, error.message);
                }
            };
            promises.push(fn());
        }

        for (const url of this.urls) {
            const fn = async () => {
                const key = `${this.getId()}:url:${url}`;
                const data = await ctx.cache?.get(key);
                if (data !== null) {
                    if (data.props) result.push(data.props);
                    return;
                }
                try {
                    const res = await fetch(`${url.replace(/\/$/, "")}/addon`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(args)
                    });
                    if (!res.ok) {
                        throw new Error(`Get status code ${res.status}`);
                    }
                    const props = await res.json();
                    props.metadata = { ...props.metadata, url };
                    validateAddonProps(props);
                    result.push(props);
                    ctx.cache?.set(key, { props });
                } catch (error) {
                    console.warn(`Failed loading ${url}:`, error.message);
                    ctx.cache?.set(key, { error: true });
                }
            };
            promises.push(fn());
        }

        await Promise.all(promises);
        return result;
    }

    public async _resolveAddonUrl(url: Url): Promise<AddonProps> {
        return {} as any;
    }

    public getAddons() {
        return this.addons;
    }

    public addAddon(addon: BasicAddon) {
        this.addons.push(addon);
    }

    public addUrl(url: Url) {
        this.urls.push(url);
    }
}

export const createRepositoryAddon = makeCreateFunction({
    AddonClass: RepositoryAddon,
    type: "repository"
});
