import {
  Addon,
  AddonRequest,
  RepositoryAddon as RepositoryAddonProps,
  RepositoryAddonActions,
} from "@mediaurl/schema";
import fetch from "node-fetch";
import { ActionHandlerContext } from "../types";
import { makeCreateFunction } from "../utils/addon-func";
import { validateAddonProps } from "../validators";
import { BasicAddonClass } from "./BasicAddonClass";
import { ActionHandlers } from "./types";

export type RepositoryHandlers = Pick<
  ActionHandlers<RepositoryAddonClass>,
  RepositoryAddonActions
>;

type Url = string;

export class RepositoryAddonClass extends BasicAddonClass<
  RepositoryHandlers,
  RepositoryAddonProps
> {
  private addons: BasicAddonClass[] = [];
  private urls: Url[] = [];

  constructor(props: RepositoryAddonProps) {
    super(props);

    this.registerActionHandler("repository", async (args, ctx) => {
      return this.getAllAddonProps(args, ctx);
    });
  }

  public validateAddon() {
    super.validateAddon();
    if (!this.addons.length && !this.urls.length) {
      throw new Error(
        `A repository addon needs at least one addon or url to an addon`
      );
    }
  }

  public async getAllAddonProps(
    input: AddonRequest,
    ctx: ActionHandlerContext
  ) {
    await ctx.requestCache([
      this.getVersion(),
      ...this.addons.map((a) => [a.getId(), a.getVersion()]),
      ...this.urls,
    ]);

    const result: Addon[] = [];
    const promises: Promise<void>[] = [];

    for (const addon of this.addons) {
      const fn = async () => {
        const id = addon.getId();
        try {
          const handler = addon.getActionHandler("addon");
          const props: Addon = await handler(
            { ...input },
            {
              ...ctx,
              cache: ctx.cache.clone({
                prefix: addon.getId(),
                ...addon.getDefaultCacheOptions(),
              }),
            },
            addon
          );
          const url = `./${id}`;
          if (!props.endpoints) props.endpoints = [];
          if (!props.endpoints.includes(url)) props.endpoints.push(url);
          // legacy: metadata property
          props.metadata = { url };
          result.push(props);
        } catch (error) {
          console.warn(`Failed loading ${id}:`, error.message);
        }
      };
      promises.push(fn());
    }

    const cache = ctx.cache.clone({
      refreshInterval:
        ctx.cache.options.ttl === null || ctx.cache.options.ttl < 5 * 60 * 1000
          ? null
          : 60 * 1000,
    });

    for (const url of this.urls) {
      const key = [this.getVersion(), url, input.language, input.region];
      cache.call(key, async () => {});
      const fn = async () => {
        try {
          const res = await fetch(
            // legacy: .watched extension
            `${url.replace(
              /\/((addon|mediaurl)(\.(json|watched))?)?$/,
              ""
            )}/mediaurl.json`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(input),
            }
          );
          if (!res.ok) {
            throw new Error(`Get status code ${res.status}`);
          }
          const props = await res.json();
          if (!props.endpoints) props.endpoints = [];
          if (!props.endpoints.includes(url)) props.endpoints.push(url);
          // legacy: metadata property
          props.metadata = { ...props.metadata, url };
          validateAddonProps(props);
          result.push(props);
        } catch (error) {
          console.warn(`Failed loading ${url}:`, error.message);
        }
      };
      promises.push(fn());
    }

    await Promise.all(promises);
    return result;
  }

  public async _resolveAddonUrl(url: Url): Promise<Addon> {
    return {} as any;
  }

  public getAddons() {
    return this.addons;
  }

  public addAddon(addon: BasicAddonClass) {
    this.addons.push(addon);
    return this;
  }

  public addUrl(url: Url) {
    this.urls.push(url);
    return this;
  }
}

export const createRepositoryAddon = makeCreateFunction<
  RepositoryAddonProps,
  RepositoryAddonClass
>({
  AddonClass: RepositoryAddonClass,
  type: "repository",
});
