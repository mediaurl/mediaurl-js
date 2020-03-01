import { createWriteStream, WriteStream } from "fs";

export type RecordData = {
  action: string;
  input: any;
  statusCode: number;
  result: any;
};

export class RequestRecorder {
  private readonly stream: WriteStream;

  constructor(private readonly path: string) {
    this.stream = createWriteStream(path, { flags: "w" });
  }

  async write(data: RecordData) {
    await new Promise((resolve, reject) =>
      this.stream.write(JSON.stringify(data) + "\n", (error?: Error) =>
        error ? reject(error) : resolve()
      )
    );
  }

  close() {
    this.stream.close();
  }
}
