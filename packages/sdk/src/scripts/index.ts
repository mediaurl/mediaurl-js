#!/usr/bin/env node
import { fork } from "child_process";
import * as commander from "commander";
import { guessTsMain } from "guess-ts-main";
import path = require("path");
import { ServeAddonsOptions } from "../server";

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

  const scriptPath = path.resolve(__dirname, "utils", "start-entrypoint");
  const execPath = path.resolve(cwd, "node_modules", ".bin", "ts-node-dev");

  const opts = <Partial<ServeAddonsOptions>>{
    singleMode: cmdObj.single ? true : false,
    requestRecorderPath: cmdObj.record ? cmdObj.record : null
  };

  fork(
    scriptPath,
    [JSON.stringify(opts), ...files],
    cmdObj.prod || !tsConfig
      ? undefined
      : { execPath, execArgv: ["--no-notify", "--transpileOnly"] }
  );
};

commander
  .command("start [files...]")
  .option("--prod", "Start the server in production mode")
  .option(
    "--single",
    "Start a single addon server. The addon will be mounted on /"
  )
  .option(
    "--record <path>",
    "Record all requests and responses so they can be used for testing"
  )
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
