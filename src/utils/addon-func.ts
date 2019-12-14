import { Addon as AddonProps } from "@watchedcom/schema/dist/entities";

import { BasicAddon } from "../addons/BasicAddon";
import { validateAddonProps } from "../validators";

interface Opts {
    AddonClass: any;
    type: string;
}

export const makeCreateFunction = <
    P extends AddonProps,
    C extends BasicAddon<any>
>({
    AddonClass,
    type
}: Opts) => {
    const createAddon = (props: Partial<P>): C => {
        const addonProps = validateAddonProps<P>({ ...props, type });
        const addon = new AddonClass(addonProps);
        return addon;
    };

    return createAddon;
};
