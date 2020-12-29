import { DiskCache, MemoryCache } from "@mediaurl/sdk";
import { promises as fsPromises } from "fs";
import * as os from "os";
import * as path from "path";
import { testCache } from "../src";

describe(`MemoryCache`, () => {
  testCache("memory", () => new MemoryCache());
});

describe(`DiskCache`, () => {
  const tempPath = path.join(os.tmpdir(), "mediaurl-sdk-test-");
  testCache(
    "disk",
    async () => new DiskCache(await fsPromises.mkdtemp(tempPath))
  );
});
