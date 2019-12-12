import { getServerValidators } from "@watchedcom/schema";
import { WorkerAddon as WorkerAddonProps } from "@watchedcom/schema/dist/entities";

import { ActionType } from "./addons";

/** Wrapper arount crazy untyped `@watched/schema` getServerValidators stuff */
export const validateWorkerAddonProps = (input: any): WorkerAddonProps => {
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

export const validateActionPostBody = (action: ActionType, body: any) => {
    console.log("validate", { action, body });
    const validator = getServerValidators().actions[action];

    if (!validator) {
        throw new Error(`No validator for "${action}" found in schema`);
    }

    return validator.request(body);
};
