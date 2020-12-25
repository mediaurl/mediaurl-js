import { BundleAddon, BundleAddonActions } from "@mediaurl/schema";
import { makeCreateFunction } from "../utils/addon-func";
import { BasicAddonClass } from "./BasicAddonClass";
import { ActionHandlers } from "./types";

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
