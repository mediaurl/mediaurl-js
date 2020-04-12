import { BundleAddon, BundleAddonActions } from "@watchedcom/schema";
import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";
import { BasicAddonClass } from "./BasicAddonClass";

export type BundleHandlers = Pick<
  ActionHandlers<BundleAddonClass>,
  BundleAddonActions
>;

export class BundleAddonClass extends BasicAddonClass<
  BundleHandlers,
  BundleAddon
> {
  constructor(props: BundleAddon) {
    super(props);
  }

  public validateAddon() {
    super.validateAddon();
    if (!this.props.requirements?.length) {
      throw new Error(`Bundle addon needs at least one requirement`);
    }
  }
}

export const createBundleAddon = makeCreateFunction<
  BundleAddon,
  BundleAddonClass
>({
  AddonClass: BundleAddonClass,
  type: "bundle",
});
