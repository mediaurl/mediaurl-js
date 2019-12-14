import { Addon as AddonProps } from "@watchedcom/schema/dist/entities";

import { BasicAddon } from "../addons/BasicAddon";
import { validateAddonProps } from "../validators";

interface Opts {
    AddonClass: new (props: AddonProps) => BasicAddon<any>;
    type: AddonProps["type"];
}

export const makeCreateFunction = <
    P extends AddonProps,
    C extends BasicAddon<any>
>(
    opts: Opts
) => {
    const createAddon = (props: Partial<P>): C => {
        const addonProps = validateAddonProps<P>({ ...props, type: opts.type });
        const addon = new opts.AddonClass(addonProps) as C;
        return addon;
    };

    return createAddon;
};
