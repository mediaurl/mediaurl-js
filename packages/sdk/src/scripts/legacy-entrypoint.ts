import * as path from "path";
import { runCli } from "../cli";
import { createEngine } from "../engine";
import { loadAddons } from "./load-addons";

const detectFiles = (): string[] => {
  const cwd = process.cwd();

  try {
    const tsConfig = require(path.resolve(cwd, "tsconfig.json"));
    if (tsConfig.include) return tsConfig.include;
  } catch {}

  return [cwd];
};

const main = async () => {
  const files = detectFiles();
  const addons = await loadAddons(files);
  const engine = createEngine(addons);
  runCli(engine);
};

main();
