import {
  AddonRequest,
  AddonResponse,
  DirectoryRequest,
  DirectoryResponse,
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

export const migrations = {
  addon: {
    response(
      ctx: MigrationContext,
      input: AddonRequest,
      output: AddonResponse
    ) {
      if (output.requestArgs) {
        throw new Error(
          `DEPRECATION: The addon property "requestArgs" was renamed to "triggers"`
        );
      }
      output.sdkVersion = sdkVersion;
      output = ctx.validator.response(output);
      if (
        output.triggers &&
        (!ctx.user?.app?.version ||
          !ctx.user?.app?.name ||
          (ctx.user.app.name === "watched" &&
            semver.lt("1.1.3", ctx.user.app.version)) ||
          (ctx.user.app.name === "rokkr" &&
            semver.lt("1.1.3", ctx.user.app.version)))
      ) {
        output.requestArgs = output.triggers;
      }
      return output;
    },
  },
  directory: {
    request(ctx: MigrationContext, input: DirectoryRequest) {
      if (input.page !== undefined && input.cursor === undefined) {
        console.warn("Upgrading directory request from page to cursor system");
        ctx.data.update = 1;
        (<any>input).cursor = input.page === 1 ? null : input.page;
      }
      return ctx.validator.request(input);
    },
    response(
      ctx: MigrationContext,
      input: DirectoryRequest,
      output: DirectoryResponse
    ) {
      if (ctx.data.update === 1) {
        const o = <DirectoryResponse>output;
        o.hasMore = o.nextCursor !== null;
      }
      return ctx.validator.response(output);
    },
  },
  item: {
    request(ctx: MigrationContext, input: ItemRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
  source: {
    request(ctx: MigrationContext, input: SourceRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
  subtitle: {
    request(ctx: MigrationContext, input: SubtitleRequest) {
      if (input.nameTranslations === undefined) {
        (<any>input).nameTranslations = input.translatedNames ?? {};
      }
      return ctx.validator.request(input);
    },
  },
};
