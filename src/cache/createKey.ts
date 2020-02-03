import { createHash } from "crypto";

export const createKey = (data: any) => {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  if (str.length < 70) return str;
  const hash = createHash("sha256");
  hash.update(str);
  return hash.digest().toString("hex");
};
