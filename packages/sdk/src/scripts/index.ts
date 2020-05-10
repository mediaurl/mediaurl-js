#!/usr/bin/env node
import { fork } from "child_process";
import * as path from "path";

console.warn("WARNING: The watched-sdk cli script is legacy!");
console.warn(
  "WARNING: Please upgrade your addon to use the `createEngine` and `runCli` functions."
);

const startScript = (script: string, args: string[]) => {
  fork(path.resolve(__dirname, script), args, {
    execPath: path.resolve(
      process.cwd(),
      "node_modules",
      ".bin",
      "ts-node-dev"
    ),
    execArgv: ["--no-notify", "--transpileOnly"],
  });
};

startScript("legacy-entrypoint", process.argv.slice(2));
