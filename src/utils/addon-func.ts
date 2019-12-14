import { Addon as AddonProps } from "@watchedcom/schema/dist/entities";

import { validateAddonProps } from "../validators";

export const makeCreateFunction = <P extends AddonProps, C>(opts: {
    AddonClass: { new (props: P): C };
    type: AddonProps["type"];
}) => {
    const createAddon = (props: Partial<P>): C => {
        const addonProps = validateAddonProps<P>({ ...props, type: opts.type });
        const addon = new opts.AddonClass(addonProps);
        return addon;
    };

    return createAddon;
};
