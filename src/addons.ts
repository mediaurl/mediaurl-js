import { getServerValidators } from "@watchedcom/schema";
import { WorkerAddon as WorkerAddonProps } from "@watchedcom/schema/dist/entities";

type HandlerFn = (...args: any[]) => any;

export interface IWorkerAddon {
    registerActionHandler(action: string, handler: HandlerFn): void;
}

export class WorkerAddon implements IWorkerAddon {
    constructor(private props: WorkerAddonProps) {}

    public registerActionHandler() {}
}

/** Wrapper arount crazy untyped `@watched/schema` getServerValidators stuff */
const validateWorkerAddonProps = (input: any): WorkerAddonProps => {
    try {
        const result: WorkerAddonProps = getServerValidators().models.addon(
            input
        );
        return result;
    } catch (error) {
        // Actual error message is polluted with big json string that pollutes output
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
