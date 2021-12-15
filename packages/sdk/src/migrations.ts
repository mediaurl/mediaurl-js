import {
  Addon,
  AddonRequest,
  AddonResponse,
  CatalogRequest,
  CatalogResponse,
  ItemRequest,
  SourceRequest,
  SubtitleRequest,
} from "@mediaurl/schema";
import semver from "semver";
import { AddonClass } from "./addon";
import { ActionHandlerContext } from "./types";

const sdkVersion: string = require("../package.json").version;

export type MigrationContext = {
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

        if (addon.pages?.length && isPreVersion(ctx, "1.8.0")) {
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
