import "dotenv/config";
import { serveAddons } from "../..";
import { BasicAddonClass } from "../../addons";
import { ServeAddonsOptions } from "../../server";
import { loadAddons } from "./load-addons";

const main = async () => {
  const opts = <Partial<ServeAddonsOptions>>JSON.parse(process.argv[2]);
  const files = process.argv.slice(3);
  let addons: BasicAddonClass[];
  try {
    addons = await loadAddons(files);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  serveAddons(addons, opts);
};

main();
