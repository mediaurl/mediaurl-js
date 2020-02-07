#!/usr/bin/env node
import * as commander from "commander";
import { createHandler } from "./create";
import { startHandler } from "./start";

commander
  .command("create <name>")
  .description("Create WATCHED addon folder")
  .option("--template <template>", "js|ts")
  .option("--force")
  .action(createHandler);

commander
  .command("start [files...]")
  .option("--prod", "Start the server in production mode")
  .description("Start the WATCHED SDK server")
  .action((files: string, cmdObj: any) =>
    startHandler(Array.isArray(files) ? files : [files], cmdObj)
  );

commander.on("command:*", function() {
  commander.outputHelp();
  process.exit(1);
});

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
