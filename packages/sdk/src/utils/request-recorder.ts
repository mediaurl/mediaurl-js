import { createWriteStream, WriteStream } from "fs";

export type RecordData = {
  i: number;
  addon: string;
  action: string;
  input: any;
  statusCode: number;
  result: any;
};

export class RequestRecorder {
  private readonly stream: WriteStream;
  private i: number;

  constructor(private readonly path: string) {
    this.stream = createWriteStream(path, { flags: "w" });
    this.i = 0;
  }

  public async write(data: RecordData) {
    data.i = this.i++;
    await new Promise((resolve, reject) =>
      this.stream.write(
        JSON.stringify(data, null, 2) + "\n---\n",
        (error?: Error) => (error ? reject(error) : resolve())
      )
    );
    console.warn(
      `Recorded request ${data.i}: action=${data.action}, statusCode=${data.statusCode}`
    );
  }

  public close() {
    this.stream.close();
  }
}
