import * as zlib from "zlib";

export const compressCache = async (value: Buffer, minValueLength = 100) => {
  if (value.byteLength < minValueLength) return value;
  const temp = await new Promise<Buffer>((resolve, reject) =>
    zlib.brotliCompress(value, (error, buffer) => {
      if (error) {
        reject(error);
      } else if (buffer === undefined) {
        throw new Error("Compressed buffer is undefined");
      } else {
        resolve(buffer);
      }
    })
  );
  if (temp.byteLength + 2 >= value.byteLength * 0.9) {
    // Skip compression if the compressed value is >= 90% of it's original size
    return value;
  }
  const data = Buffer.alloc(temp.length + 2);
  data.writeInt16LE(0x1199, 0);
  temp.copy(data, 2, 0);
  return data;
};

export const decompressCache = async (value: Buffer) => {
  if (value.byteLength <= 2 || value.readInt16LE(0) !== 0x1199) {
    return value;
  }
  return await new Promise<Buffer>((resolve, reject) =>
    zlib.brotliDecompress(value.slice(2), (error, buffer) => {
      if (error) {
        reject(error);
      } else if (buffer === undefined) {
        reject(new Error("Decompressed buffer is undefined"));
      } else {
        resolve(buffer);
      }
    })
  );
};
