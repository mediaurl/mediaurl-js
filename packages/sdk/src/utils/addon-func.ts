import { Addon } from "@mediaurl/schema";

type Opts<P, C> = {
  AddonClass: { new (props: P): C };
  type: Addon["type"];
  defaults?: () => Partial<P>;
};

export const makeCreateFunction = <P extends Addon, C>(opts: Opts<P, C>) => {
  const createAddon = (props: Partial<P>): C => {
    return new opts.AddonClass(<P>{
      ...(opts.defaults ? opts.defaults() : null),
      ...props,
      type: opts.type,
    });
  };

  return createAddon;
};
