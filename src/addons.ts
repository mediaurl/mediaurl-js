import { WorkerAddon as WorkerAddonProps } from "@watchedcom/schema/dist/entities";
import * as express from "express";

import { FetchRemoteFn } from "./utils/fetch-remote";
import { validateWorkerAddonProps } from "./validators";

export type ActionType = WorkerAddonProps["resources"][0]["actions"][0];

export type ActionHandler<InputType = any, OutputType = any> = (
    input: InputType,
    context: {
        request: express.Request;
        addon: WorkerAddon;
        fetchRemote: FetchRemoteFn;
    }
) => Promise<OutputType>;

export interface IWorkerAddon {
    registerActionHandler(action: ActionType, handler: ActionHandler): void;
    getActionHandler(action: ActionType): ActionHandler;
}

export class WorkerAddon implements IWorkerAddon {
    private handlersMap: { [action: string]: ActionHandler } = {};

    constructor(private props: WorkerAddonProps) {}

    public getProps() {
        return this.props;
    }

    public registerActionHandler(action: ActionType, handlerFn: ActionHandler) {
        this.handlersMap[action] = handlerFn;
    }

    public getActionHandler(action: string): ActionHandler {
        const handlerFn = this.handlersMap[action];

        if (!handlerFn) {
            throw new Error(`No handler for "${action}" action`);
        }

        return handlerFn;
    }
}

export const createWorkerAddon = (
    props: Partial<WorkerAddonProps>
): WorkerAddon => {
    const addonProps = validateWorkerAddonProps({ ...props, type: "worker" });
    const addon = new WorkerAddon(addonProps);
    return addon;
};
