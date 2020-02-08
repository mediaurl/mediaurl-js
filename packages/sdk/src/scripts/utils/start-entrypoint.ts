import "dotenv/config";
import { serveAddons } from "../..";
import { loadAddons } from "./load-addons";

const main = () => {
  const files = process.argv.slice(2);
  const addons = loadAddons(files);
  serveAddons(addons);
};

main();
