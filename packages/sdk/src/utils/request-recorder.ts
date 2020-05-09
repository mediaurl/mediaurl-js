import { createWriteStream, WriteStream } from "fs";
import * as _ from "lodash";
import * as path from "path";
import * as util from "util";
import { BasicAddonClass } from "../addons";
import { AddonHandler, AddonHandlerFn } from "../types";

export type RecordData = {
  id: number | string;
  addon: string;
  action: string;
  input: any;
  statusCode: number;
  output: any;
};

const inspect = (data: any) =>
  util.inspect(data, {
    compact: false,
    depth: null,
  });

const getFile = (recordPath: string) => {
  return !/\.record\.js$/.test(recordPath)
    ? recordPath + ".record.js"
    : recordPath;
};

const getPath = (recordPath: string) => {
  return path.resolve(getFile(recordPath));
};

const log = (prefix: string, id: number | string, data: RecordData) => {
  console.info(
    `${prefix}: id=${id}, addon=${data.addon}, action=${data.action}, statusCode=${data.statusCode}`
  );
};

export class RequestRecorder {
  public readonly path: string;
  private readonly stream: WriteStream;
  private w: (data: string) => Promise<unknown>;
  private currentId: number;

  constructor(recordPath: string) {
    this.path = getFile(recordPath);
    this.stream = createWriteStream(getPath(this.path), { flags: "w" });
    this.w = async (data: string) =>
      new Promise((resolve, reject) =>
        this.stream.write(data, (error?: Error) =>
          error ? reject(error) : resolve()
        )
      );

    this.currentId = 1;
  }

  public async write(data: RecordData) {
    const id = this.currentId++;
    let text = "";
    if (id === 1) {
      text += `const module.exports = [];

var currentId = 1;
function addRecord(record) {
  record.id = currentId++;
  if (record.action === "addon" && record.statusCode === 200) {
    record.output.sdkVersion = require("@watchedcom/sdk/package.json").version;
  }
  module.exports.push(record);
};
`;
    }
    text += `
// Record ID ${id}
addRecord(${inspect(data)});
`;
    await this.w(text);
    log("Record", id, data);
  }

  public close() {
    this.stream.close();
  }
}

export const replayRecordData = async (
  addonHandlers: AddonHandler[],
  recordData: RecordData[],
  ids: null | RecordData["id"][] = null,
  silent: boolean = false
) => {
  for (const data of recordData) {
    if (ids && !ids.includes(data.id)) continue;
    if (!silent) log("Replay", data.id, data);

    const addonHandler = addonHandlers.find(
      (h) => h.addon.getId() === data.addon
    );
    if (!addonHandler) throw new Error(`Addon ${data.addon} not found`);

    let resolve: any;
    const p = new Promise((r) => {
      resolve = r;
    });

    addonHandler
      .handler({
        action: data.action,
        input: data.input,
        sig: "",
        request: {
          ip: "127.0.0.1",
          headers: {},
        },
        sendResponse: (statusCode, body) => resolve({ statusCode, body }),
      })
      .catch((error) =>
        resolve({ statusCode: 500, error: error.message ?? error })
      );

    const res: { statusCode: number; body: any } = <any>await p;
    if (res.statusCode !== data.statusCode) {
      throw new Error(
        `Expected: Status code ${data.statusCode}, got ${res.statusCode}`
      );
    }
    // Comparing of string-only JSON responses is buggy in supertest,
    // so let's use lodash.isEqual
    if (typeof data.output === "function") {
      const r = data.output(res);
      if (r !== undefined && !r) {
        throw new Error(`Output check failed, got ${inspect(res.body)}`);
      }
    } else if (!_.isEqual(res.body, data.output)) {
      throw new Error(
        `Expected: ${inspect(data.output)} output, got ${inspect(res.body)}`
      );
    }
  }
};

export const replayRecordFile = async (
  addonHandlers: AddonHandler[],
  recordPath: string,
  ids: null | RecordData["id"][] = null,
  silent: boolean = false
) => {
  const recordData: RecordData[] = await import(getPath(recordPath));
  await replayRecordData(addonHandlers, recordData, ids, silent);
};
