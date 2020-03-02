import { BasicAddonClass, createApp, RecordData } from "@watchedcom/sdk";
import { promises as fsPromises } from "fs";
import * as request from "supertest";

export const replayRecording = async (
  addons: BasicAddonClass[],
  recordPath: string
) => {
  const recordData = (await fsPromises.readFile(recordPath)).toString();

  const app = request(createApp(addons));
  for (const raw of recordData.split("\n---\n")) {
    if (!raw) continue;
    const data: RecordData = JSON.parse(raw);
    await app
      .post(`/${data.addon}/${data.action}`)
      .send(data.input)
      .expect(data.statusCode, data.result);
  }
};
