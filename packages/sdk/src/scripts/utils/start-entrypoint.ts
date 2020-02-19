import "dotenv/config";
import { serveAddons } from "../..";
import { loadAddons } from "./load-addons";

const main = () => {
  const mode = process.argv[2];
  console.warn("mode", mode);
  const files = process.argv.slice(3);
  const addons = loadAddons(files);
  serveAddons(addons, {
    singleMode: mode === "single"
  });
};

main();
