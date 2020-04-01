import { ServeAddonsOptions } from "../server";

export type StartArgs = {
  opts: Partial<ServeAddonsOptions>;
  files: string[];
};

export type ReplayArgs = {
  files: string[];
  recordPath: string;
  ids: null | number[];
  silent: boolean;
};
