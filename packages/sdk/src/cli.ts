import * as program from "commander";
import "dotenv/config";
import { BasicAddonClass } from "./addons";
import { createEngine } from "./engine";
import { IExpressServerOptions, serveAddons } from "./express-server";
import { Engine } from "./types";
import { replayRecordFile } from "./utils/request-recorder";

export const runCli = (
  engine: Engine | BasicAddonClass[],
  expressOptions?: IExpressServerOptions
) => {
  const myEngine = Array.isArray(engine) ? createEngine(engine) : engine;

  program.version(require("../package.json").version);

  program
    .command("start", { isDefault: true })
    .description("Start the WATCHED SDK express server (default)")
    .option(
      "-r, --record <record-file>",
      "Record all requests and responses so they can be used for testing"
    )
    .action((args: any) => {
      if (args.record) {
        myEngine.updateOptions({ requestRecorderPath: args.record });
      }
      serveAddons(myEngine, expressOptions);
    });

  program
    .command("replay")
    .description("Replay a previously recorded session")
    .requiredOption(
      "-r, --record <record-file>",
      "The previously recorded file"
    )
    .option(
      "-i, --id <id>",
      "Choose which ID's to replay (komma separated list)"
    )
    .option("-s, --silent", "Be less verbose")
    .action(async (files: string, args: any) => {
      process.env.SKIP_AUTH = "1";
      try {
        myEngine.updateOptions({ replayMode: true });
        await replayRecordFile(
          myEngine,
          args.recordPath,
          args.ids,
          args.silent
        );
        console.log("Replay finished successful");
        process.exit(0);
      } catch (error) {
        console.error(error);
        console.log("Replay finished with errors");
        process.exit(1);
      }
    });

  program.on("command:*", function () {
    program.outputHelp();
    process.exit(1);
  });

  if (!process.argv.slice(2).length) {
    console.info(
      "Hint: Start the addon with `-h` to see all available command line options"
    );
  }

  program.parse(process.argv);
};
