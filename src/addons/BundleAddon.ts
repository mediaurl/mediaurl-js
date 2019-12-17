import { BundleAddon as BundleAddonProps } from "@watchedcom/schema";

import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicAddon } from "./BasicAddon";

export type BundleAddonActions = Pick<
    ActionHandlers<BundleAddon>,
    /** FIXME: need to define set of available actions from schema */
    never
    // BundleAddonProps['resources'][0]['actions'][0]
>;

export class BundleAddon extends BasicAddon<
    BundleAddonActions,
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
