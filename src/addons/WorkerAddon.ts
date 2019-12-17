import {
    WorkerAddon as WorkerAddonProps,
    WorkerAddonActions
} from "@watchedcom/schema";

import { ActionHandlers } from "../interfaces";
import { makeCreateFunction } from "../utils/addon-func";

import { BasicAddon } from "./BasicAddon";

export type WorkerHandlers = Pick<
    ActionHandlers<WorkerAddon>,
    WorkerAddonActions
>;

export class WorkerAddon extends BasicAddon<WorkerHandlers, WorkerAddonProps> {}

export const createWorkerAddon = makeCreateFunction({
    AddonClass: WorkerAddon,
    type: "worker"
});
