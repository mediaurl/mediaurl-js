const fork = require("child_process").fork;
const { guessTsMain } = require("guess-ts-main");
const path = require("path");

const cwd = process.cwd();

const serveScriptPath = path.resolve(__dirname, "serve-entrypoint");

const startHandler = (files, cmdObj) => {
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

  console.info(`Serving addons: ${files.join(", ")}`);
  console.info(`Live reload: ${!cmdObj.prod}`);

  const execPath = path.resolve(cwd, "node_modules", ".bin", "ts-node-dev");
  return fork(
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

module.exports = { startHandler };
