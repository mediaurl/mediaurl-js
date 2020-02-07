import "dotenv/config";
import { serveAddons } from "../src";
import { loadAddons } from "./utils/load-addons";

const main = () => {
  const files = process.argv.slice(2);
  const addons = loadAddons(files);
  serveAddons(addons);
};

main();
