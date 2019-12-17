import { WorkerAddon as WorkerAddonProps } from "@watchedcom/schema";

import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicAddon } from "./BasicAddon";

export type WorkerAddonActions = Pick<
    ActionHandlers<WorkerAddon>,
    WorkerAddonProps["resources"][0]["actions"][0]
>;

export class WorkerAddon extends BasicAddon<
    WorkerAddonActions,
    WorkerAddonProps
> {}

export const createWorkerAddon = makeCreateFunction({
    AddonClass: WorkerAddon,
    type: "worker"
});
