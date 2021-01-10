import { Addon, getServerValidators } from "@mediaurl/schema";

const handleError = (kind: string, error: Error) => {
  console.error(error.message);
  console.error(
    `Data validation of ${kind} failed.\n` +
      `Check out our schema at https://www.mediaurl.io/swagger`
  );
  return new Error("Validation error");
};

export const validateAddonProps = <T extends Addon>(input: any): T => {
  try {
    const validator = getServerValidators().models.addon[input.type];
    if (!validator) {
      throw new Error(`No validator for addon type "${input.type}" found`);
    }
    return validator(input);
  } catch (error) {
    throw handleError("addon", error);
  }
};

export const getActionValidator = (addonType: string, action: string) => {
  const validators = getServerValidators();
  const validator =
    validators.actions[addonType]?.[action] ?? validators.actions.basic[action];
  if (!validator) {
    throw new Error(`No validator for action "${action}" found`);
  }
  if (
    validator.addonTypes !== undefined &&
    !validator.addonTypes.includes(addonType)
  ) {
    throw new Error(
      `No validator for action "${action}" and addon type "${addonType}" found`
    );
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
    },
  };
};
