import "dotenv/config";
import * as path from "path";
import { BasicAddonClass } from "../addons";
import { createEngine } from "../engine";
import { ExpressServerAddonOptions, serveAddons } from "../express-server";
import { loadAddons } from "./load-addons";
import { StartArgs } from "./types";

const tryGetServeOpts = (onPath: string): ExpressServerAddonOptions | null => {
  try {
    const requiredFile = require(onPath);
    const exportedValues = { default: requiredFile, ...requiredFile };
    const opts = Object.values(exportedValues).filter(
      (val): val is ExpressServerAddonOptions => {
        if (val instanceof ExpressServerAddonOptions) {
          return true;
        }
        return false;
      }
    );
    return opts[0];
  } catch {}

  return null;
};

const main = async () => {
  const argv: StartArgs = JSON.parse(process.argv[2]);

  const userDefinedOptions = tryGetServeOpts(
    path.resolve(process.cwd(), ".watched.js")
  );

  let addons: BasicAddonClass[];
  try {
    addons = await loadAddons(argv.files);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  const engine = createEngine(addons);
  serveAddons(engine, { ...userDefinedOptions, ...argv.opts });
};

main();
