import { createWriteStream, WriteStream } from "fs";

export type RecordData = {
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
    await new Promise((resolve, reject) =>
      this.stream.write(
        JSON.stringify(data, null, 2) + "\n---\n",
        (error?: Error) => (error ? reject(error) : resolve())
      )
    );
    this.i++;
  }

  public getI() {
    return this.i;
  }

  public close() {
    this.stream.close();
  }
}
