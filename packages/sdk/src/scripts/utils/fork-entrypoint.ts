import { fork } from "child_process";
import { guessTsMain } from "guess-ts-main";
import * as path from "path";

export const forkEntrypoint = (
  files: string[],
  isProduction: boolean = false,
  execBin: string,
  execArgv?: string[]
) => {
  const cwd = process.cwd();

  let tsConfig = null;
  try {
    tsConfig = require(path.resolve(cwd, "tsconfig.json"));
  } catch {}

  if ((isProduction && files.length === 0) || !tsConfig) {
    files.push(cwd);
  }

  // It's a ts project and we want to start ts version instead
  if (tsConfig && files.length === 0) {
    files.push(guessTsMain(cwd));
  }

  const scriptPath = path.resolve(__dirname, "start-entrypoint");
  const execPath = path.resolve(cwd, "node_modules", ".bin", execBin);
  console.warn(scriptPath, files);

  fork(
    scriptPath,
    files,
    isProduction || !tsConfig ? undefined : { execPath, execArgv }
  );
};
