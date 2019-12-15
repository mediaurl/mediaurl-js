import {
    Addon as AddonProps,
    ApiRepositoryRequest,
    ApiRepositoryResponse,
    RepositoryAddon as RepositoryAddonProps
} from "@watchedcom/schema/dist/entities";

import { ActionHandler } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

type RepositoryActionsMap = BasicActions & {
    repository: ActionHandler<ApiRepositoryRequest, ApiRepositoryResponse>;
};

type Url = string;

export class RepositoryAddon extends BasicAddon<
    RepositoryActionsMap,
    RepositoryAddonProps
> {
    private addons: (AddonProps | Url)[] = [];

    constructor(p: RepositoryAddonProps) {
        super(p);

        this.registerActionHandler("repository", async input => {
            return [];
        });
    }

    public async _resolveAddonUrl(url: Url): Promise<AddonProps> {
        return {} as any;
    }

    public addUrl() {}

    public addAddon(addon: BasicAddon) {
        this.addons.push(addon.getProps());
    }
}

export const createRepositoryAddon = makeCreateFunction({
    AddonClass: RepositoryAddon,
    type: "repository"
});
