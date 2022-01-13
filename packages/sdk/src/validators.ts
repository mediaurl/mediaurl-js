import { Addon, AddonActions, getServerValidators } from "@mediaurl/schema";

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
      const catalogIds = new Set<string>([]);
      for (const catalog of addon.catalogs) {
        const id = catalog.id ?? "";
        if (catalogIds.has(id)) {
          throw new Error(
            `Catalog ID's must be unique, ID "${catalog.id}" already exists`
          );
        }
        catalogIds.add(id);
      }
    }
    if (addon.pages) {
      const pageIds = new Set<string>([]);
      for (const page of addon.pages) {
        const pageId = page.id ?? "";
        if (pageIds.has(pageId)) {
          throw new Error(
            `Page ID's must be unique, ID "${page.id}" already exists`
          );
        }
        pageIds.add(pageId);
        if (page.dashboards) {
          const dashboardIds = new Set<string>([]);
          for (const item of page.dashboards) {
            switch (item.type) {
              case "copyItems":
                break;
              case "channel":
              case "iptv":
              case "movie":
              case "series":
              case "unknown":
                break;
              case "directory": {
                const id = item.id ?? "";
                if (dashboardIds.has(id)) {
                  throw new Error(
                    `Dashboard ID's must be unique, ID "${page.id}/${id}" already exists`
                  );
                }
                dashboardIds.add(id);
                break;
              }
            }
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
