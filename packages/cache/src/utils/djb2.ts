export const djb2 = (str: string) => {
  const buf = Buffer.from(str);
  let hash = 5381;
  for (let i = 0; i < buf.length; i += 1) {
    hash = (hash << 5) + hash + buf[i];
  }
  return hash;
};
