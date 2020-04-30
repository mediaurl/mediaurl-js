import { IExpressServerOptions } from "../interfaces";

export type StartArgs = {
  opts: Partial<IExpressServerOptions>;
  files: string[];
};

export type ReplayArgs = {
  files: string[];
  recordPath: string;
  ids: null | number[];
  silent: boolean;
};
