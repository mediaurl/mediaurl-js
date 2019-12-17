import {
    Addon as AddonProps,
    ApiRepositoryRequest,
    ApiRepositoryResponse,
    RepositoryAddon as RepositoryAddonProps
} from "@watchedcom/schema";

import { ActionHandler } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

type RepositoryActionsMap = BasicActions & {
    repository: ActionHandler<
        ApiRepositoryRequest,
        ApiRepositoryResponse,
        RepositoryAddon
    >;
};

type Url = string;

export class RepositoryAddon extends BasicAddon<
    RepositoryActionsMap,
    RepositoryAddonProps
> {
    private addons: BasicAddon[] = [];
    private urls: Url[] = [];

    constructor(p: RepositoryAddonProps) {
        super(p);

        this.registerActionHandler("repository", async (args, ctx) => {
            const result: AddonProps[] = [];
            args.index = true;
            for (const addon of this.addons) {
                const url = addon.isRootAddon
                    ? "./"
                    : `'./${addon.getProps().id}`;
                const handler = addon.getActionHandler("addon");
                const props: AddonProps = await handler(args, ctx);
                props.metadata = { url };
                result.push(props);
            }
            for (const url of this.urls) {
                // TODO: Load props from remote repo via a POST /addon call
                throw new Error("Repository URL's are not yet implemented");
            }
            return result;
        });
    }

    public async _resolveAddonUrl(url: Url): Promise<AddonProps> {
        return {} as any;
    }

    public getAddons() {
        return this.addons;
    }

    public addAddon(addon: BasicAddon) {
        addon.hasRepository = true;
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
