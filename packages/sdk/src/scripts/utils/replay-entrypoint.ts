import "dotenv/config";
import { BasicAddonClass } from "../../addons";
import { replayRequests } from "../../utils/request-recorder";
import { loadAddons } from "./load-addons";

const main = async () => {
  const recordPath = process.argv[2];
  const files = process.argv.slice(3);
  let addons: BasicAddonClass[];
  try {
    addons = await loadAddons(files);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  process.env.SKIP_AUTH = "1";
  try {
    await replayRequests(addons, recordPath);
    console.log("Replay finished successful");
    process.exit(0);
  } catch (error) {
    console.error(error);
    console.log("Replay finished with errors");
    process.exit(1);
  }
};

main();
