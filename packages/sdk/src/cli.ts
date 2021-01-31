import program from "commander";
import "dotenv/config";
import { BasicAddonClass } from "./addons";
import { createEngine } from "./engine";
import { IExpressServerOptions, serveAddons } from "./express-server";
import { Engine } from "./types";
import { replayRecordFile } from "./utils/request-recorder";

export const runCli = (
  engine: Engine | BasicAddonClass[],
  expressOptions?: Partial<IExpressServerOptions>
) => {
  const myEngine = Array.isArray(engine) ? createEngine(engine) : engine;

  program.version(require("../package.json").version);

  program
    .command("start", { isDefault: true })
    .description("Start the MediaURL SDK express server (default)")
    .option("-r, --record <record-file>", "Record all requests and responses")
    .action((args: Record<string, any>) => {
      if (args.record) {
        myEngine.updateOptions({ requestRecorderPath: args.record });
      }
      if (args.single) {
        if (!expressOptions) expressOptions = {};
        expressOptions.singleMode = args.single;
      }
      serveAddons(myEngine, expressOptions);
    });

  program
    .command("replay <record-file>")
    .description("Replay recorded requests")
    .option(
      "-i, --id <id>",
      "Choose which ID's to replay (komma separated list)"
    )
    .option("-s, --silent", "Be less verbose")
    .action(async (file: string, args: Record<string, any>) => {
      try {
        await replayRecordFile(
          myEngine,
          file,
          args.id ? args.id.split(",") : null,
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

  program
    .command("cleanup-cache")
    .description("Run the garbage collector of the caching engine")
    .action(() => {
      const cache = myEngine.getCacheHandler();
      cache.engine.cleanup();
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
