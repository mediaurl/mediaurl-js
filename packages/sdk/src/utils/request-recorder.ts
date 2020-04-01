import { createWriteStream, promises as fsPromises, WriteStream } from "fs";
import * as path from "path";
import { BasicAddonClass } from "../addons";
import { createApp } from "../server";

export type RecordData = {
  id: number;
  addon: string;
  action: string;
  input: any;
  statusCode: number;
  output: any;
};

const getFile = (recordPath: string) => {
  if (!/\.record\.js$/.test(recordPath)) recordPath += ".record.js";
  else if (!/\.js$/.test(recordPath)) recordPath += ".js";
  return recordPath;
};

const getPath = (recordPath: string) => {
  return path.resolve(getFile(recordPath));
};

const log = (prefix: string, data: RecordData) => {
  console.warn(
    `${prefix}: id=${data.id}, addon=${data.addon}, action=${data.action}, statusCode=${data.statusCode}`
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

    this.currentId = 0;
  }

  public async write(data: RecordData) {
    if (this.currentId === 0) {
      await this.w("module.exports = [];\n");
      await this.w("module.exports.version = 1;\n");
    }
    data.id = ++this.currentId;
    await this.w(`module.exports.push(${JSON.stringify(data, null, 2)})\n`);
    log("Record", data);
  }

  public close() {
    this.stream.close();
  }
}

export const replayRequests = async (
  addons: BasicAddonClass[],
  recordPath: string,
  ids: null | number[],
  silent: boolean
) => {
  const request = await import("supertest");
  const recordData: RecordData[] = await import(getPath(recordPath));

  const app = request(createApp(addons));
  for (const data of recordData) {
    if (ids && !ids.includes(data.id)) continue;
    if (!silent) log("Replay", data);
    await app
      .post(`/${data.addon}/${data.action}.watched`)
      .send(data.input)
      .expect(data.statusCode, data.output);
  }
};
