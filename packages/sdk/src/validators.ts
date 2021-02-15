import { Addon, AddonActions, getServerValidators } from "@mediaurl/schema";

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
    return getServerValidators().models.addon(input);
  } catch (error) {
    throw handleError("addon", error);
  }
};

export const getActionValidator = (action: AddonActions) => {
  const validator = getServerValidators().actions[action];
  if (!validator) {
    throw new Error(`No validator for action "${action}" found`);
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
