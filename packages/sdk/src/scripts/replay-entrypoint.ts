import "dotenv/config";
import { BasicAddonClass } from "../addons";
import { createEngine } from "../engine";
import { replayRecordFile } from "../utils/request-recorder";
import { loadAddons } from "./load-addons";
import { ReplayArgs } from "./types";

const main = async () => {
  const argv: ReplayArgs = JSON.parse(process.argv[2]);

  let addons: BasicAddonClass[];
  try {
    addons = await loadAddons(argv.files);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  process.env.SKIP_AUTH = "1";
  try {
    const engine = createEngine(addons, { replayMode: true });
    await replayRecordFile(engine, argv.recordPath, argv.ids, argv.silent);
    console.log("Replay finished successful");
    process.exit(0);
  } catch (error) {
    console.error(error);
    console.log("Replay finished with errors");
    process.exit(1);
  }
};

main();
