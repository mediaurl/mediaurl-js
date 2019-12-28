import { getServerValidators, Addon } from "@watchedcom/schema";

const handleError = (action: string, error: Error) => {
    console.error(error.message);
    console.error(
        `Data validation of action ${action} failed.\nCheck out our schema at https://www.watched.com/swagger`
    );
    return new Error("Validation error");
};

/** Wrapper arount crazy untyped `@watched/schema` getServerValidators stuff */
export const validateAddonProps = <T extends Addon>(input: any): T => {
    try {
        const result: T = getServerValidators().models.addon(input);
        return result;
    } catch (error) {
        throw handleError("addon", error);
    }
};

export const getActionValidator = (action: string) => {
    const validator = getServerValidators().actions[action];
    if (!validator) {
        throw new Error(`No validator for "${action}" found in schema`);
    }
    return {
        request: (data: any) => {
            try {
                return validator.request(data);
            } catch (error) {
                throw handleError(`${action}.request`, error);
            }
        },
        response: (data: any) => {
            try {
                return validator.response(data);
            } catch (error) {
                throw handleError(`${action}.response`, error);
            }
        }
    };
};
