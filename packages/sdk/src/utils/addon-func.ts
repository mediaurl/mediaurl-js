import { Addon } from "@watchedcom/schema";
import { validateAddonProps } from "../validators";

export const makeCreateFunction = <P extends Addon, C>(opts: {
  AddonClass: { new (props: P): C };
  type: Addon["type"];
  defaults?: Partial<P>;
}) => {
  const createAddon = (props: Partial<P>): C => {
    const addonProps = validateAddonProps<P>({
      ...opts.defaults,
      ...props,
      type: opts.type
    });
    const addon = new opts.AddonClass(addonProps);
    return addon;
  };

  return createAddon;
};
