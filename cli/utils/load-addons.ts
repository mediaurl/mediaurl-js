import { flatten, uniqBy } from "lodash";
import * as path from "path";
import { BasicAddon } from "../../src/addons";

const requireAddons = (pathStr: string) => {
  const requiredFile = require(pathStr);
  const sources = [requiredFile, ...Object.values(requiredFile)];

  const addons: BasicAddon[] = sources.filter((addon: BasicAddon) => {
    try {
      // Make sure it's a WATCHED addon
      addon.getProps();
      addon.getType();
      addon.getId();
      return true;
    } catch (e) {
      return false;
    }
  });
  if (addons.length === 0) {
    throw new Error(
      `Script "${pathStr}" does not export any valid WATCHED addons.`
    );
  }

  return addons;
};

export const loadAddons = (files: string[]) => {
  if (files.length === 0) files.push(".");
  const cwd = process.cwd();
  return uniqBy(
    flatten(files.map(file => requireAddons(path.resolve(cwd, file)))),
    addon => addon
  );
};
