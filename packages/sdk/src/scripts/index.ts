#!/usr/bin/env node
import { fork } from "child_process";
import * as commander from "commander";
import { guessTsMain } from "guess-ts-main";
import path = require("path");

export const startHandler = (files: string[], cmdObj: any) => {
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

  fork(
    scriptPath,
    files,
    cmdObj.prod || !tsConfig
      ? undefined
      : { execPath, execArgv: ["--no-notify", "--transpileOnly"] }
  );
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
