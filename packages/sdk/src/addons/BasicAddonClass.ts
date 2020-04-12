import {
  Addon,
  AddonRequest,
  AddonResponse,
  AddonTypes,
} from "@watchedcom/schema";
import { cloneDeep } from "lodash";
import * as semver from "semver";
import { CacheOptionsParam } from "../cache";
import { ActionHandler, HandlersMap } from "../interfaces";
import { validateAddonProps } from "../validators";

export type BasicHandlers = {
  addon: ActionHandler<AddonRequest, AddonResponse, BasicAddonClass>;
};

export abstract class BasicAddonClass<
  HM extends HandlersMap = BasicHandlers,
  P extends Addon = Addon
> {
  private handlersMap: HandlersMap = {
    addon: async () => this.getProps(),
  };
  private defaultCacheOptions: CacheOptionsParam;

  constructor(protected readonly props: P) {
    this.defaultCacheOptions = {};
  }

  public validateAddon() {
    validateAddonProps(this.getProps());
  }

  public getProps(): P {
    return cloneDeep(this.props);
  }

  public getType(): AddonTypes {
    return this.props.type;
  }

  public getId(): Addon["id"] {
    return this.props.id;
  }

  public getVersion(): Addon["version"] {
    return this.props.version;
  }

  public getMajorVersion(): number {
    const majorVersion = semver.parse(this.props.version)?.major;
    if (majorVersion === undefined) {
      throw new Error(
        `Failed getting major version from  "${this.props.version}" of addon "${this.props.id}"`
      );
    }
    return majorVersion;
  }

  public registerActionHandler<A extends Extract<keyof HM, string>>(
    action: A,
    handler: HM[A]
  ) {
    this.handlersMap[action] = handler;
    return this;
  }

  public unregisterActionHandler(action: keyof HandlersMap) {
    delete this.handlersMap[action];
  }

  public getActionHandler(action: string) {
    const handler = this.handlersMap[action];
    if (!handler) {
      throw new Error(`No handler for "${action}" action`);
    }
    return handler;
  }

  public hasActionHandler(action: keyof HandlersMap) {
    return !!this.handlersMap[action];
  }

  public setDefaultCacheOptions(options: CacheOptionsParam) {
    this.defaultCacheOptions = {
      ...this.defaultCacheOptions,
      ...options,
    };
    return this;
  }

  public getDefaultCacheOptions() {
    return this.defaultCacheOptions;
  }
}
