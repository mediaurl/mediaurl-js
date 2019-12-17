import {
    BundleAddon as BundleAddonProps,
    BundleAddonActions
} from "@watchedcom/schema";

import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicAddon } from "./BasicAddon";

export type BundleHandlers = Pick<
    ActionHandlers<BundleAddon>,
    BundleAddonActions
>;

export class BundleAddon extends BasicAddon<BundleHandlers, BundleAddonProps> {
    constructor(p: BundleAddonProps) {
        super(p);
    }
}

export const createBundleAddon = makeCreateFunction({
    AddonClass: BundleAddon,
    type: "bundle"
});
