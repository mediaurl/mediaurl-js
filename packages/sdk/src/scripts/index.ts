#!/usr/bin/env node
import { fork } from "child_process";
import * as program from "commander";
import { guessTsMain } from "guess-ts-main";
import path = require("path");
import { ServeAddonsOptions } from "../server";
import { ReplayArgs, StartArgs } from "./types";

const startScript = (
  script: string,
  args: string[],
  production: boolean,
  tsArgs: string[]
) => {
  fork(
    path.resolve(__dirname, "utils", script),
    args,
    production
      ? undefined
      : {
          execPath: path.resolve(
            process.cwd(),
            "node_modules",
            ".bin",
            "ts-node-dev"
          ),
          execArgv: ["--no-notify", "--transpileOnly", "--respawn", ...tsArgs]
        }
  );
};

export const startHandler = (files: string[], cmdObj: any) => {
  if (cmdObj.record && cmdObj.prod) {
    throw new Error("Request recording is only available in development mode");
  }

  const cwd = process.cwd();

  let tsConfig = null;
  try {
    tsConfig = require(path.resolve(cwd, "tsconfig.json"));
  } catch {}

  if ((cmdObj.prod && files.length === 0) || !tsConfig) {
    files.push(cwd);
  }

  // It's a ts project and we want to start ts version instead
  if (tsConfig && files.length === 0) {
    files.push(guessTsMain(cwd));
  }

  startScript(
    "start-entrypoint",
    [
      JSON.stringify(<StartArgs>{
        opts: {
          singleMode: cmdObj.single ? true : false,
          requestRecorderPath: cmdObj.record ? cmdObj.record : null
        },
        files
      })
    ],
    cmdObj.prod || !tsConfig,
    []
  );
};

export const replayHandler = (files: string[], cmdObj: any) => {
  startScript(
    "replay-entrypoint",
    [
      JSON.stringify(<ReplayArgs>{
        recordPath: cmdObj.record,
        files
      })
    ],
    false,
    cmdObj.watch ? ["--respawn", "--watch", "."] : []
  );
};

program.version(require("../../package.json").version);

program
  .command("start [files...]")
  .description("Start the WATCHED SDK server")
  .option("-p, --prod", "Start the server in production mode")
  .option(
    "-s, --single",
    "Start a single addon server. The addon will be mounted on /"
  )
  .option(
    "-r, --record <record-file>",
    "Record all requests and responses so they can be used for testing. Not available with --prod"
  )
  .action((files: string, cmdObj: any) =>
    startHandler(Array.isArray(files) ? files : [files], cmdObj)
  );

program
  .command("replay [files...]")
  .description("Replay a previously recorded session")
  .requiredOption("-r, --record <record-file>", "The previously recorded file")
  .option("-w, --watch", "Watch for changes and re-run the script")
  .action((files: string, cmdObj: any) =>
    replayHandler(Array.isArray(files) ? files : [files], cmdObj)
  );

program.on("command:*", function() {
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
