import "dotenv/config";
import { BasicAddonClass } from "../addons";
import { serveAddons } from "../server";
import { loadAddons } from "./load-addons";
import { StartArgs } from "./types";

const main = async () => {
  const argv: StartArgs = JSON.parse(process.argv[2]);
  let addons: BasicAddonClass[];
  try {
    addons = await loadAddons(argv.files);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  serveAddons(addons, argv.opts);
};

main();
