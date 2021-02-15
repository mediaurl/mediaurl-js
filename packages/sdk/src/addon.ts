import { Addon, AddonActions, AddonResourceActions } from "@mediaurl/schema";
import { cloneDeep } from "lodash";
import { CacheOptionsParam } from "./cache";
import { ActionHandlers, ResolverHandlerFn } from "./types";
import { validateAddonProps } from "./validators";

const resourceActions: AddonResourceActions[] = [
  "directory",
  "item",
  "source",
  "subtitle",
  "resolve",
  "captcha",
  "iptv",
];

type Resolver = {
  pattern: RegExp[];
  handler: ResolverHandlerFn;
};

export class AddonClass {
  private handlersMap: Partial<ActionHandlers> = {
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
  private resolvers: Resolver[];

  constructor(protected readonly props: Addon) {
    this.defaultCacheOptions = {};
    this.resolvers = [];
  }

  public validateAddon() {
    validateAddonProps(this.getProps());
    if (
      this.props.actions?.some((action: AddonActions) =>
        ["item", "source", "subtitle"].includes(action)
      ) &&
      !this.props.itemTypes?.length
    ) {
      throw new Error(
        `Addon actions "item", "source" and "subtitle" need at least one value in "itemType".`
      );
    }
  }

  public getProps(): Addon {
    return cloneDeep(this.props);
  }

  public getId(): Addon["id"] {
    return this.props.id;
  }

  public getVersion(): Addon["version"] {
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

  public registerActionHandler<A extends Extract<keyof ActionHandlers, string>>(
    action: A,
    handler: ActionHandlers[A]
  ) {
    // Add actions which are not yet defined
    const resourceAction = <AddonResourceActions>action;
    if (resourceActions.includes(resourceAction)) {
      if (!this.props.actions) this.props.actions = [];
      if (!this.props.actions?.includes(resourceAction)) {
        this.props.actions.push(resourceAction);
      }
    }

    // Add handler to map
    this.handlersMap[action] = handler;
    return this;
  }

  public unregisterActionHandler(action: keyof ActionHandlers) {
    delete this.handlersMap[action];
  }

  public getActionHandler(action: string) {
    const handler = this.handlersMap[action];
    if (!handler) {
      throw new Error(`No handler for "${action}" action`);
    }
    return handler;
  }

  public hasActionHandler(action: keyof ActionHandlers) {
    return !!this.handlersMap[action];
  }

  /**
   * Helper function to create resolver functions for multiple hosts.
   * Of course you still can use the direct method via
   * `registerActionHanlder("resolve", handlerFunction)`.
   */
  public async addResolveHandler(
    pattern: RegExp | string | (RegExp | string)[],
    handler: ResolverHandlerFn
  ) {
    // Prepare the `pattern` parameter
    if (!Array.isArray(pattern)) pattern = [pattern];
    pattern = pattern.map((p) => (typeof p === "string" ? new RegExp(p) : p));

    // Add the handler to our resolvers
    this.resolvers.push({ pattern: <RegExp[]>pattern, handler });

    // Add the patterns to `addon.urlPatterns`
    if (!this.props.urlPatterns) this.props.urlPatterns = [];
    for (const p of pattern) {
      this.props.urlPatterns.push((<RegExp>p).source);
    }

    // Register the default resolve action handler
    if (!this.hasActionHandler("resolve")) {
      this.registerActionHandler("resolve", async (input, ctx) => {
        for (const resolver of this.resolvers) {
          for (const pattern of resolver.pattern) {
            const match = pattern.exec(input.url);
            if (match) {
              return await resolver.handler(match, input, ctx);
            }
          }
        }
        throw new Error("No resolver found");
      });
    }

    return this;
  }
}

export const createAddon = (props: Addon) => {
  return new AddonClass(props);
};
