import { IptvAddon, IptvAddonActions } from "@mediaurl/schema";
import { makeCreateFunction } from "../utils/addon-func";
import { BasicAddonClass } from "./BasicAddonClass";
import { ActionHandlers } from "./types";

export type IptvHandlers = Pick<
  ActionHandlers<IptvAddonClass>,
  IptvAddonActions
>;

export class IptvAddonClass extends BasicAddonClass<IptvHandlers, IptvAddon> {
  constructor(props: IptvAddon) {
    super(props);
  }

  public validateAddon() {
    super.validateAddon();
    if (!this.hasActionHandler("iptv") && !this.props.playlistUrl) {
      throw new Error(
        `An IPTV addon needs at least an iptv action handler or a playlist URL`
      );
    }
  }
}

export const createIptvAddon = makeCreateFunction<IptvAddon, IptvAddonClass>({
  AddonClass: IptvAddonClass,
  type: "iptv",
  defaults: () => ({ actions: [] }),
});
