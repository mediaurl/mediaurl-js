import {
    ApiDirectoryRequest,
    ApiDirectoryResponse,
    ApiItemRequest,
    ApiItemResponse,
    ApiResolveRequest,
    ApiResolveResponse,
    ApiSourceRequest,
    ApiSourceResponse,
    ApiSubtitleRequest,
    ApiSubtitleResponse,
    WorkerAddon as WorkerAddonProps
} from "@watchedcom/schema/dist/entities";

import { ActionHandler } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicActions, BasicAddon } from "./BasicAddon";

export type WorkerActionsMap = BasicActions & {
    directory: ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse>;
    item: ActionHandler<ApiItemRequest, ApiItemResponse>;
    source: ActionHandler<ApiSourceRequest, ApiSourceResponse>;
    subtitle: ActionHandler<ApiSubtitleRequest, ApiSubtitleResponse>;
    resolve: ActionHandler<ApiResolveRequest, ApiResolveResponse>;
};

export class WorkerAddon extends BasicAddon<
    WorkerActionsMap,
    WorkerAddonProps
> {}

export const createWorkerAddon = makeCreateFunction({
    AddonClass: WorkerAddon,
    type: "worker"
});
