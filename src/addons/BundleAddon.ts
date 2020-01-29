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

    public validateAddon() {
        if (!this.props.requirements?.length) {
            throw new Error(`Bundle addon needs at least on requirement`);
        }
    }
}

export const createBundleAddon = makeCreateFunction<
    BundleAddonProps,
    BundleAddon
>({
    AddonClass: BundleAddon,
    type: "bundle"
});
