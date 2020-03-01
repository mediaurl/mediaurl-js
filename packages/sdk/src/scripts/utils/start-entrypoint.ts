import "dotenv/config";
import { serveAddons } from "../..";
import { ServeAddonsOptions } from "../../server";
import { loadAddons } from "./load-addons";

const main = () => {
  const opts = <Partial<ServeAddonsOptions>>JSON.parse(process.argv[2]);
  const files = process.argv.slice(3);
  const addons = loadAddons(files);
  serveAddons(addons, opts);
};

main();
