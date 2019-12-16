import { BundleAddon as BundleAddonProps } from "@watchedcom/schema";

import { ActionHandler } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

type BundleActionsMap = BasicActions & {};

export class BundleAddon extends BasicAddon<
    BundleActionsMap,
    BundleAddonProps
> {
    constructor(p: BundleAddonProps) {
        super(p);
    }
}

export const createBundleAddon = makeCreateFunction({
    AddonClass: BundleAddon,
    type: "bundle"
});
