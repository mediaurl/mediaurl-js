import {
  Addon,
  AddonActions,
  GenericId,
  getServerValidators,
} from "@mediaurl/schema";

const handleError = (kind: string, error: Error) => {
  console.error(error.message);
  console.error(
    `Data validation of ${kind} failed.\n` +
      `Check out our schema at https://www.mediaurl.io/swagger`
  );
  return new Error("Validation error");
};

export const validateAddonProps = (input: Addon) => {
  try {
    const addon: Addon = getServerValidators().models.addon(input);
    if (addon.catalogs) {
      const ids = new Set<GenericId>([]);
      for (const e of addon.catalogs) {
        const id = e.id ?? "";
        if (ids.has(id)) {
          throw new Error(
            `Catalog ID's must be unique, ID "${e.id}" already exists`
          );
        }
        ids.add(id);
      }
    }
    if (addon.pages) {
      const ids = new Set<GenericId>([]);
      for (const e of addon.pages) {
        const id = e.id ?? "";
        if (ids.has(id)) {
          throw new Error(
            `Page ID's must be unique, ID "${e.id}" already exists`
          );
        }
        ids.add(id);
        if (e.dashboards) {
          const dashboardIds = new Set<GenericId>([]);
          const ids = new Set<GenericId>([]);
          for (const d of e.dashboards) {
            const id = d.id ?? "";
            if (dashboardIds.has(id)) {
              throw new Error(
                `Dashboard ID's must be unique, ID "${d.id}" already exists`
              );
            }
            ids.add(id);
          }
        }
      }
    }
    return addon;
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
