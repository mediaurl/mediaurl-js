import { IptvAddon, IptvAddonActions } from "@watchedcom/schema";
import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";
import { BasicAddonClass } from "./BasicAddonClass";

export type IptvHandlers = Pick<
  ActionHandlers<IptvAddonClass>,
  IptvAddonActions
>;

export class IptvAddonClass extends BasicAddonClass<IptvHandlers, IptvAddon> {
  constructor(props: IptvAddon) {
    super(props);
  }
}

export const createIptvAddon = makeCreateFunction<IptvAddon, IptvAddonClass>({
  AddonClass: IptvAddonClass,
  type: "iptv"
});
