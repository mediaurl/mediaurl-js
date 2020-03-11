import { createWriteStream, promises as fsPromises, WriteStream } from "fs";
import * as path from "path";
import { BasicAddonClass } from "../addons";
import { createApp } from "../server";

export type RecordData = {
  i: number;
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

export class RequestRecorder {
  public readonly path: string;
  private readonly stream: WriteStream;
  private w: (data: string) => Promise<unknown>;
  private i: number;

  constructor(recordPath: string) {
    this.path = getFile(recordPath);
    this.stream = createWriteStream(getPath(this.path), { flags: "w" });
    this.w = async (data: string) =>
      new Promise((resolve, reject) =>
        this.stream.write(data, (error?: Error) =>
          error ? reject(error) : resolve()
        )
      );

    this.i = 0;
  }

  public async write(data: RecordData) {
    data.i = this.i++;
    if (data.i === 0) await this.w("module.exports = [];\n");
    await this.w(`module.exports.push(${JSON.stringify(data, null, 2)})\n`);
    console.warn(
      `Recorded request ${data.i}: action=${data.action}, statusCode=${data.statusCode}`
    );
  }

  public close() {
    this.stream.close();
  }
}

export const replayRequests = async (
  addons: BasicAddonClass[],
  recordPath: string
) => {
  const request = await import("supertest");
  const recordData = await import(getPath(recordPath));

  const app = request(createApp(addons));
  for (const data of recordData) {
    await app
      .post(`/${data.addon}/${data.action}.watched`)
      .send(data.input)
      .expect(data.statusCode, data.output);
  }
};
