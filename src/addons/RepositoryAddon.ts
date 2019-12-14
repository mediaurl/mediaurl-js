import { RepositoryAddon as RepositoryAddonProps } from "@watchedcom/schema/dist/entities";

import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

type RepositoryActionsMap = BasicActions & {};

export class RepositoryAddon extends BasicAddon<
    RepositoryActionsMap,
    RepositoryAddonProps
> {}

export const createRepositoryAddon = makeCreateFunction({
    AddonClass: RepositoryAddon,
    type: "repository"
});
