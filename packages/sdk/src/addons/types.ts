import {
  AddonRequest,
  AddonResponse,
  CaptchaRequest,
  CaptchaResponse,
  DirectoryRequest,
  DirectoryResponse,
  IptvRequest,
  IptvResponse,
  ItemRequest,
  ItemResponse,
  RepositoryRequest,
  RepositoryResponse,
  ResolveRequest,
  ResolveResponse,
  SelftestRequest,
  SelftestResponse,
  SourceRequest,
  SourceResponse,
  SubtitleRequest,
  SubtitleResponse,
} from "@mediaurl/schema";
import { ActionHandler } from "../types";
import { BasicAddonClass } from "./BasicAddonClass";

/**
 * Should include all available handlers.
 * It's base type to pick from (by action).
 */
export type ActionHandlers<T extends BasicAddonClass> = {
  // All addons
  selftest: ActionHandler<SelftestRequest, SelftestResponse, T>;
  addon: ActionHandler<AddonRequest, AddonResponse, T>;

  // Repository addons
  repository: ActionHandler<RepositoryRequest, RepositoryResponse, T>;

  // Worker addons
  directory: ActionHandler<DirectoryRequest, DirectoryResponse, T>;
  item: ActionHandler<ItemRequest, ItemResponse, T>;
  source: ActionHandler<SourceRequest, SourceResponse, T>;
  subtitle: ActionHandler<SubtitleRequest, SubtitleResponse, T>;
  resolve: ActionHandler<ResolveRequest, ResolveResponse, T>;
  captcha: ActionHandler<CaptchaRequest, CaptchaResponse, T>;

  // IPTV addons
  iptv: ActionHandler<IptvRequest, IptvResponse, T>;
};
