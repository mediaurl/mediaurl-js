import { fork } from "child_process";
import { guessTsMain } from "guess-ts-main";
import * as path from "path";

const cwd = process.cwd();

const serveScriptPath = path.resolve(__dirname, "serve-entrypoint");

export const startHandler = (files: string[], cmdObj: any) => {
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

  const execPath = path.resolve(cwd, "node_modules", ".bin", "ts-node-dev");
  fork(
    serveScriptPath,
    files,
    cmdObj.prod
      ? undefined
      : {
          execPath,
          execArgv: ["--no-notify", "--transpileOnly"]
        }
  );
};
