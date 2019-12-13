import {
    ApiDirectoryRequest,
    ApiDirectoryResponse,
    ApiItemResponse,
    DefaultItemRequest,
    WorkerAddon as WorkerAddonProps
} from "@watchedcom/schema/dist/entities";

import { ActionHandler, IWorkerAddon } from "./interfaces";
import { validateWorkerAddonProps } from "./validators";

type ActionType = WorkerAddonProps["resources"][0]["actions"][0];

export interface ActionsMap {
    directory: ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse>;
    // "item": ActionHandler<DefaultItemRequest, ApiItemResponse>;
    // "source": ActionHandler<ApiSou, ApiDirectoryResponse>;
    // "subtitle": ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse>;
    // "resolve": ActionHandler<ApiDirectoryRequest, ApiDirectoryResponse>;
    [key: string]: ActionHandler;
}

export class WorkerAddon implements IWorkerAddon {
    private handlersMap: { [action: string]: ActionHandler } = {};

    constructor(private props: WorkerAddonProps) {}

    public getProps() {
        return this.props;
    }

    public registerActionHandler<A extends ActionType>(
        action: A,
        handlerFn: ActionsMap[A]
    ) {
        if (this.handlersMap[action]) {
            throw new Error(
                `Another handler is already registered for "${action}" action`
            );
        }
        this.handlersMap[action] = handlerFn;

        return this;
    }

    public unregisterActionHandler(action: keyof ActionsMap) {
        delete this.handlersMap[action];
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
