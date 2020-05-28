import * as snappy from "snappy";

export const compress = async (value: string) => {
  if (value.length <= 100) return Buffer.from(value);
  const temp = await new Promise<Buffer>((resolve, reject) =>
    snappy.compress(value, (error, buffer) => {
      if (error) {
        reject(error);
      } else if (buffer === undefined) {
        throw new Error("Compressed buffer is undefined");
      } else {
        resolve(buffer);
      }
    })
  );
  const data = Buffer.alloc(temp.length + 2);
  data.writeInt16LE(0x1199, 0);
  temp.copy(data, 1);
  return data;
};

export const decompress = async (value: Buffer) => {
  if (value.byteLength <= 2 && value.readInt16LE(0) !== 0x1199) {
    return value.toString();
  }
  return await new Promise<string>((resolve, reject) =>
    snappy.uncompress(value.slice(2), { asBuffer: true }, (error, buffer) => {
      if (error) reject(error);
      if (!buffer) {
        reject(new Error("Decompress buffer is undefined"));
      }
      resolve((<Buffer>buffer).toString());
    })
  );
};
