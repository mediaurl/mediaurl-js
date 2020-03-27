import {
  Addon,
  AddonRequest,
  RepositoryAddon as RepositoryAddonProps,
  RepositoryAddonActions,
  RepositoryRequest
} from "@watchedcom/schema";
import fetch from "node-fetch";
import { ActionHandlerContext, ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";
import { validateAddonProps } from "../validators";
import { BasicAddonClass } from "./BasicAddonClass";

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

    this.registerActionHandler(
      "repository",
      async (args: RepositoryRequest, ctx: ActionHandlerContext) => {
        return this.getAllAddonProps(args, ctx);
      }
    );
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
                ...addon.getDefaultCacheOptions()
              })
            },
            addon
          );
          props.metadata = { url: `./${id}` };
          result.push(props);
        } catch (error) {
          console.warn(`Failed loading ${id}:`, error.message);
        }
      };
      promises.push(fn());
    }

    for (const url of this.urls) {
      const fn = async () => {
        const key = [this.getId(), url, input.language, input.region];
        const data = await ctx.cache.get(key);
        if (data !== undefined) {
          if (data.props) result.push(data.props);
          return;
        }
        try {
          const res = await fetch(`${url.replace(/\/$/, "")}/addon`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input)
          });
          if (!res.ok) {
            throw new Error(`Get status code ${res.status}`);
          }
          const props = await res.json();
          props.metadata = { ...props.metadata, url };
          validateAddonProps(props);
          result.push(props);
          ctx.cache.set(key, { props });
        } catch (error) {
          console.warn(`Failed loading ${url}:`, error.message);
          ctx.cache.set(key, { error: true });
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
  type: "repository"
});
