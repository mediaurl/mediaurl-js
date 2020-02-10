#!/usr/bin/env node
import * as commander from "commander";
import { forkEntrypoint } from "./utils/fork-entrypoint";

export const startHandler = (files: string[], cmdObj: any) => {
  forkEntrypoint(files, cmdObj.prod, "ts-node-dev", [
    "--no-notify",
    "--transpileOnly"
  ]);
};

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
