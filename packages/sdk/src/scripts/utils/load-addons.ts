import { uniqBy } from "lodash";
import * as path from "path";
import { BasicAddonClass } from "../../addons";

const requireAddons = async (pathStr: string) => {
  const requiredFile = require(pathStr);
  const sources = { default: requiredFile, ...requiredFile };

  const addons: BasicAddonClass[] = [];
  const keys = Object.keys(sources);
  while (keys.length > 0) {
    const key = <string>keys.shift();
    const source = sources[key];
    try {
      // Make sure it's a WATCHED addon
      source.getProps();
      source.getType();
      source.getId();
      addons.push(source);
    } catch (e) {
      if (typeof source?.then === "function") {
        console.info(`Resolving exported promise "${key}"`);
        const value = await Promise.resolve(source);
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            const k = `${key}_` + i;
            sources[k] = value[i];
            keys.push(k);
          }
        } else {
          sources[key] = value;
          keys.push(key);
        }
      }
    }
  }
  if (addons.length === 0) {
    throw new Error(
      `Script "${pathStr}" does not export any valid WATCHED addons.`
    );
  }

  return addons;
};

export const loadAddons = async (files: string[]) => {
  if (files.length === 0) files.push(".");
  const cwd = process.cwd();
  let addons: BasicAddonClass[] = [];
  for (const file of files) {
    addons = [...addons, ...(await requireAddons(path.resolve(cwd, file)))];
  }
  return uniqBy(addons, addon => addon);
};
