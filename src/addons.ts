import { getServerValidators } from "@watchedcom/schema";
import { WorkerAddon as WorkerAddonProps } from "@watchedcom/schema/dist/entities";

export type ActionType = WorkerAddonProps["resources"][0]["actions"][0];

export type ActionHandler<Req = any, Res = any> = (input: Req) => Promise<Res>;

export interface IWorkerAddon {
    registerActionHandler(action: ActionType, handler: ActionHandler): void;
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

    public handleAction(action: string, opts) {
        const handlerFn = this.handlersMap[action];

        if (!handlerFn) {
            throw new Error(`No handler for "${action}" action`);
        }

        return handlerFn(opts);
    }
}

/** Wrapper arount crazy untyped `@watched/schema` getServerValidators stuff */
const validateWorkerAddonProps = (input: any): WorkerAddonProps => {
    try {
        const result: WorkerAddonProps = getServerValidators().models.addon(
            input
        );
        return result;
    } catch (error) {
        // Actual error message contains big json string that pollutes output
        console.error(
            `Addon validation failed.\nCheck out schema at https://github.com/watchedcom/schema/blob/master/schema.yaml`
        );
        throw new Error("Validation error");
    }
};

export const createWorkerAddon = (
    props: Partial<WorkerAddonProps>
): WorkerAddon => {
    const addonProps = validateWorkerAddonProps({ ...props, type: "worker" });
    const addon = new WorkerAddon(addonProps);
    return addon;
};
