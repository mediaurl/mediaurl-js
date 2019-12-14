import { RepositoryAddon as RepositoryAddonProps } from "@watchedcom/schema/dist/entities";

import { ActionHandler } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

type RepositoryActionsMap = BasicActions & {
    repository: ActionHandler;
};

export class RepositoryAddon extends BasicAddon<
    RepositoryActionsMap,
    RepositoryAddonProps
> {
    constructor(p: RepositoryAddonProps) {
        super(p);

        this.registerActionHandler("repository", async input => {
            return { ok: "default repository response" };
        });
    }

    public addUrl() {}

    public addAddon() {}
}

export const createRepositoryAddon = makeCreateFunction({
    AddonClass: RepositoryAddon,
    type: "repository"
});
