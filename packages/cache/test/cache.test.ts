import { promises as fsPromises } from "fs";
import * as os from "os";
import * as path from "path";
import { DiskCache } from "../src/engines/disk";
import { MemoryCache } from "../src/engines/memory";
import { testCache } from "../src/utils/test-utils";

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
