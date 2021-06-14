import { testCache } from "@mediaurl/cache/dist/utils/test-utils";
import { RedisCache } from "../src";

if (process.env.REDIS_URL) {
  testCache(
    "redis",
    () => new RedisCache({ url: <string>process.env.REDIS_URL })
  );
} else {
  describe("RedisCache", () => {
    test("noop", () => {});
  });
}
