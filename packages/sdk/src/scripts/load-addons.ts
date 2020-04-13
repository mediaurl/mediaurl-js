import * as path from "path";
import { BasicAddonClass } from "../addons";

const isAddon = (item: any): item is BasicAddonClass => {
  try {
    item.getProps();
    item.getType();
    item.getId();
    return true;
  } catch {}
  return false;
};

const _filterAddons = async (
  exportedValues: any[]
): Promise<BasicAddonClass[]> => {
  const result: (BasicAddonClass | BasicAddonClass[])[] = [];

  for (const _ of exportedValues) {
    const item = await Promise.race([
      _,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              "Unable to resolve exported value for a long period of time"
            )
          );
        }, 15000);
      }),
    ]);

    if (Array.isArray(item)) {
      result.push(await _filterAddons(item));
    }

    if (isAddon(item)) {
      result.push(item);
    }
  }
  return result.flat();
};

const _requireAddons = async (pathStr: string) => {
  const requiredFile = require(pathStr);
  const sources = { default: requiredFile, ...requiredFile };

  const addons = await _filterAddons(Object.values(sources));

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

  return Promise.all(
    files.map((file) => path.resolve(cwd, file)).map(_requireAddons)
  ).then((_) => _.flat());
};
