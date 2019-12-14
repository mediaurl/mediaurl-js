import { getServerValidators } from "@watchedcom/schema";
import { Addon } from "@watchedcom/schema/dist/entities";

/** Wrapper arount crazy untyped `@watched/schema` getServerValidators stuff */
export const validateAddonProps = <T extends Addon>(input: any): T => {
    try {
        const result: T = getServerValidators().models.addon(input);
        return result;
    } catch (error) {
        // Actual error message contains big json string that pollutes output
        console.error(
            `Addon validation failed.\nCheck out schema at https://github.com/watchedcom/schema/blob/master/schema.yaml`
        );
        throw new Error("Validation error");
    }
};

export const validateActionPostBody = (action: string, body: any) => {
    console.log("validate", { action, body });
    const validator = getServerValidators().actions[action];

    if (!validator) {
        throw new Error(`No validator for "${action}" found in schema`);
    }

    return validator.request(body);
};
