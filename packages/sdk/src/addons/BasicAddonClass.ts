import {
  Addon,
  AddonRequest,
  AddonResponse,
  AddonTypes,
  SelftestRequest,
  SelftestResponse,
} from "@mediaurl/schema";
import { cloneDeep } from "lodash";
import { CacheOptionsParam } from "../cache";
import { ActionHandler } from "../types";
import { validateAddonProps } from "../validators";

export type BasicHandlers = {
  selftest: ActionHandler<SelftestRequest, SelftestResponse, BasicAddonClass>;
  addon: ActionHandler<AddonRequest, AddonResponse, BasicAddonClass>;
};

type HandlersMap = Record<string, ActionHandler>;

export abstract class BasicAddonClass<
  HM extends HandlersMap = BasicHandlers,
  P extends Addon = Addon
> {
  private handlersMap: HandlersMap = {
    selftest: async (input, ctx) => {
      const key = `selftest-${Date.now()}-${Math.random()}`;
      await ctx.cache.set(key, "1", 60 * 1000);
      const value = await ctx.cache.get(key);
      if (value !== "1") throw new Error("Cache test failed");
      return "ok";
    },
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

  public getId(): P["id"] {
    return this.props.id;
  }

  public getVersion(): P["version"] {
    return this.props.version;
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

  protected onRegisterAction(action: string) {
    // noop
  }

  public registerActionHandler<A extends Extract<keyof HM, string>>(
    action: A,
    handler: HM[A]
  ) {
    this.handlersMap[action] = handler;
    this.onRegisterAction(action);
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
}
