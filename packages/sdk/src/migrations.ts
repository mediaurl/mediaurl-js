import {
  Addon,
  AddonRequest,
  AddonResponse,
  BaseDirectoryItem,
  CatalogRequest,
  CatalogResponse,
  DirectoryItem,
  ItemRequest,
  ItemResponse,
  MainItem,
  SourceRequest,
  SubtitleRequest,
} from "@mediaurl/schema";
import semver from "semver";
import { AddonClass } from "./addon";
import { ActionHandlerContext } from "./types";

const sdkVersion: string = require("../package.json").version;

export type MigrationContext = {
  clientVersion: null | string;
  addon: AddonClass;
  data: any;
  user: ActionHandlerContext["user"];
  validator: {
    request: (obj: any) => any;
    response: (obj: any) => any;
  };
};

const isPreVersion = (ctx: MigrationContext, version: string) =>
  !ctx.user?.app?.version || semver.lt(version, ctx.user.app.version);

const isPreClientVersion = (ctx: MigrationContext, version: string) => {
  return !ctx.clientVersion || semver.lt(version, ctx.clientVersion);
};

const downgradeDirectoryV2 = (directory: {
  options?: any;
  items?: MainItem[];
  initialData?: BaseDirectoryItem["initialData"];
}) => {
  if (directory.options?.shape) {
    directory.options.imageShape = directory.options.shape;
    delete directory.options.shape;
  }
  if (![undefined, "landscape", "square"].includes(directory.options?.shape)) {
    directory.options.imageShape = "regular";
  }

  if (directory.initialData) {
    directory.items = directory.initialData.items;
    delete directory.initialData;
  }
};

export const migrations = {
  addon: {
    response(
      ctx: MigrationContext,
      input: AddonRequest,
      output: AddonResponse
    ) {
      const addon = <Addon>ctx.validator.response(output);
      const any = <any>addon;
      if (any.type !== "server") {
        if (any.requestArgs) {
          throw new Error(
            `DEPRECATION: The addon property "requestArgs" was renamed to "triggers"`
          );
        }

        if (addon.triggers && isPreVersion(ctx, "1.1.3")) {
          any.requestArgs = addon.triggers;
        }

        if (isPreClientVersion(ctx, "2.1.0")) {
          console.warn('isPreClientVersion(ctx, "2.1.0")', ctx.clientVersion);
          addon.catalogs?.forEach(downgradeDirectoryV2);
          if (addon.pages?.length) {
            addon.pages.forEach((page) => {
              if (page.dashboards) {
                page.dashboards = page.dashboards.filter(
                  (dashboard) => dashboard.type === "directory"
                );
                page.dashboards?.forEach((dashboard) => {
                  if (dashboard.type === "directory") {
                    downgradeDirectoryV2(dashboard);
                  }
                });
              }
            });
          }
        }

        if (addon.pages?.length && isPreVersion(ctx, "1.8.0")) {
          console.warn('isPreVersion(ctx, "1.8.0")', ctx.user?.app.version);
          if (!addon.pages[0]?.dashboards) {
            throw new Error(
              `Legacy app version ${ctx.user?.app?.version} requires predefined dashboards on first page`
            );
          }
          any.dashboards = addon.pages[0].dashboards;
        }

        any.sdkVersion = sdkVersion;
      }
      return addon;
    },
  },
  catalog: {
    request(ctx: MigrationContext, input: CatalogRequest) {
      if (input.rootId) {
        input.catalogId = input.rootId as string;
      }
      if (input.page !== undefined && input.cursor === undefined) {
        console.warn("Upgrading catalog request from page to cursor system");
        ctx.data.update = 1;
        (<any>input).cursor = input.page === 1 ? null : input.page;
        delete input.page;
      }
      return ctx.validator.request(input);
    },
    response(
      ctx: MigrationContext,
      input: CatalogRequest,
      output: CatalogResponse
    ) {
      output = ctx.validator.response(output);

      if (ctx.data.update === 1) {
        const o = <CatalogResponse>output;
        (<any>o).hasMore = o.nextCursor !== null;
      }

      if (isPreClientVersion(ctx, "2.1.0")) {
        output.items?.forEach((item) => {
          if (item.type === "directory") {
            downgradeDirectoryV2(item);
          }
        });
        downgradeDirectoryV2(output);
      }

      return output;
    },
  },
  item: {
    request(ctx: MigrationContext, input: ItemRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
        delete input.translatedNames;
      }
      return ctx.validator.request(input);
    },
    response(ctx: MigrationContext, input: ItemRequest, output: ItemResponse) {
      output = ctx.validator.response(output);

      if (isPreClientVersion(ctx, "2.1.0")) {
        if (output?.similarItems) {
          (output.similarItems as DirectoryItem[]).forEach((directory) => {
            downgradeDirectoryV2(directory);
            (directory.items as any[])?.forEach((item) => {
              if (item.type === "directory") {
                downgradeDirectoryV2(item);
              }
            });
          });
        }
      }
      return ctx.validator.response(output);
    },
  },
  source: {
    request(ctx: MigrationContext, input: SourceRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
        delete input.translatedNames;
      }
      return ctx.validator.request(input);
    },
  },
  subtitle: {
    request(ctx: MigrationContext, input: SubtitleRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
        delete input.translatedNames;
      }
      return ctx.validator.request(input);
    },
  },
};
