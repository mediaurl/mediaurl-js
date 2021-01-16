import { testCache } from "@mediaurl/test-utils";
import { createFromUrl, getTypeFromUrl } from "../src";

let i = 1;
for (; ; i++) {
  const url = process.env[`TEST_URL_${i}`];
  if (!url) break;
  const type = getTypeFromUrl(url);
  testCache(<string>type, () =>
    createFromUrl(url, { name: String(Math.random()) })
  );
}

if (i === 1) {
  describe("SqlCache", () => {
    test("noop", () => {});
  });
}
