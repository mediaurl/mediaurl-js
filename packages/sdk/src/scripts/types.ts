import { IServeAddonsOptions } from "../interfaces";

export type StartArgs = {
  opts: Partial<IServeAddonsOptions>;
  files: string[];
};

export type ReplayArgs = {
  files: string[];
  recordPath: string;
  ids: null | number[];
  silent: boolean;
};
