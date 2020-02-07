import { forkEntrypoint } from "./utils/fork-entrypoint";

export const startHandler = (files: string[], cmdObj: any) => {
  forkEntrypoint(files, cmdObj.prod, "start-entrypoint", "ts-node-dev", [
    "--no-notify",
    "--transpileOnly"
  ]);
};
