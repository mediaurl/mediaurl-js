#!/usr/bin/env node
import { fork } from "child_process";
import * as program from "commander";
import { guessTsMain } from "guess-ts-main";
import path = require("path");
import { ReplayArgs, StartArgs } from "./types";

const startScript = (
  script: string,
  args: string[],
  production: boolean,
  tsArgs: string[]
) => {
  fork(
    path.resolve(__dirname, script),
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
          execArgv: ["--no-notify", "--transpileOnly", ...tsArgs],
        }
  );
};

/**
 * Returns production: boolean
 */
const detectFiles = (files: string[], production: boolean) => {
  const cwd = process.cwd();

  let tsConfig = null;
  try {
    tsConfig = require(path.resolve(cwd, "tsconfig.json"));
  } catch {}

  if ((production && files.length === 0) || !tsConfig) {
    files.push(cwd);
  }

  // It's a ts project and we want to start ts version instead
  if (tsConfig && files.length === 0) {
    files.push(guessTsMain(cwd));
  }

  return production || !tsConfig;
};

export const startHandler = (files: string[], cmdObj: any) => {
  if (cmdObj.record && cmdObj.prod) {
    throw new Error("Request recording is only available in development mode");
  }

  const production = detectFiles(files, cmdObj.prod);
  startScript(
    "start-entrypoint",
    [
      JSON.stringify(<StartArgs>{
        files,
        opts: {
          singleMode: cmdObj.single ? true : false,
          requestRecorderPath: cmdObj.record ? cmdObj.record : null,
        },
      }),
    ],
    production,
    production ? [] : ["--respawn"]
  );
};

export const replayHandler = (files: string[], cmdObj: any) => {
  detectFiles(files, cmdObj.prod);
  startScript(
    "replay-entrypoint",
    [
      JSON.stringify(<ReplayArgs>{
        files,
        recordPath: cmdObj.record,
        ids: cmdObj.id
          ? cmdObj.id.split(",").map((id) => parseInt(id, 10))
          : null,
        silent: cmdObj.silent,
      }),
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
  .option("-i, --id <id>", "Choose which ID's to replay (komma separated list)")
  .option("-s, --silent", "Be less verbose")
  .option("-w, --watch", "Watch for changes and re-run the script")
  .action((files: string, cmdObj: any) =>
    replayHandler(Array.isArray(files) ? files : [files], cmdObj)
  );

program.on("command:*", function () {
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
