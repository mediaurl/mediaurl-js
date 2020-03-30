import { promises as fsPromises } from "fs";
import * as os from "os";
import * as path from "path";
import { CacheHandler, DiskCache, MemoryCache } from "../src/cache";

// On slow computers the default waiting times may cause timeouts
const multiplicator = 2;

const options = {
  ttl: 1000 * multiplicator,
  errorTtl: 500 * multiplicator,
  prefix: "foobar"
};
const refreshInterval = 200 * multiplicator;
const functionWait = 150 * multiplicator;

const sleep = async (t: number) =>
  await new Promise(resolve => setTimeout(resolve, t));

const fnFailed = async () => {
  await sleep(functionWait);
  throw new Error("failed");
};
const fn1 = async () => {
  await sleep(functionWait);
  return "1";
};
const fn2 = async () => {
  await sleep(functionWait);
  return "2";
};

const engines: any[] = [];

// Test memory engine
engines.push({
  name: "memory",
  create: () => new MemoryCache(),
  destroy: () => null
});

// Test disk engine
const tempPath = path.join(os.tmpdir(), "watched-sdk-test-");
engines.push({
  name: "disk",
  create: async () => new DiskCache(await fsPromises.mkdtemp(tempPath)),
  destroy: async (engine: DiskCache) => {
    await fsPromises.rmdir(engine.rootPath, { maxRetries: 1, recursive: true });
  }
});

for (const engine of engines) {
  describe(`CacheHandler with ${engine.name} engine`, () => {
    let cache: CacheHandler;

    beforeEach(async done => {
      cache = new CacheHandler(await engine.create(), options);
      done();
    });

    afterEach(async done => {
      await engine.destroy(cache.engine);
      done();
    });

    // test("createKey", () => {
    //   expect(cache.createKey("hello")).toBe(':["foobar","hello"]');
    //   expect(cache.createKey(["hello".repeat(100)])).toBe(
    //     ":lclr7Dgb4S4I0onTzZqNy5ylCbNgZd5x6X+5Y228Xag="
    //   );
    // });

    test("get, set, delete", async done => {
      await expect(cache.get("hello")).resolves.toBeUndefined();
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await expect(cache.set("hello", "2")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("2");
      await expect(cache.delete("hello")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("set disabled", async done => {
      cache.setOptions({ ttl: null });
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("setError disabled", async done => {
      cache.setOptions({ errorTtl: null });
      await expect(cache.setError("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("set forever", async done => {
      cache.setOptions({ ttl: Infinity });
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      done();
    });

    test("setError forever", async done => {
      cache.setOptions({ errorTtl: Infinity });
      await expect(cache.setError("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      done();
    });

    test("set and expire", async done => {
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await sleep(options.ttl * 1.2);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("setError and expire", async done => {
      await expect(cache.setError("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await sleep(options.errorTtl * 1.2);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("refresh interval with stored value", async done => {
      cache.setOptions({ refreshInterval });
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await sleep(refreshInterval * 1.2);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await expect(cache.set("hello", "2")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("2");
      done();
    });

    test("refresh interval with stored error", async done => {
      cache.setOptions({ refreshInterval, storeRefreshErrors: true });
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await sleep(refreshInterval * 1.2);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await expect(cache.setError("hello", "error")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("error");
      done();
    });

    test("refresh interval with ignored error", async done => {
      cache.setOptions({ refreshInterval, storeRefreshErrors: false });
      await expect(cache.set("hello", "1")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await sleep(refreshInterval * 1.2);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      await expect(cache.setError("hello", "error")).resolves.toBeUndefined();
      await expect(cache.get("hello")).resolves.toBe("1");
      done();
    });

    test("waitKey timeout", async done => {
      const t = Date.now();
      await expect(
        cache.waitKey("hello", functionWait, true, 10 * multiplicator)
      ).rejects.toThrowError("Wait timed out");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);
      done();
    });

    test("waitKey success with delete", async done => {
      const t = Date.now();
      setTimeout(() => cache.set("hello", "1"), functionWait / 2);
      await expect(
        cache.waitKey("hello", functionWait, true, 10 * multiplicator)
      ).resolves.toBe("1");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait / 2);
      expect(Date.now() - t).toBeLessThan(functionWait);
      await expect(cache.get("hello")).resolves.toBeUndefined();
      done();
    });

    test("waitKey success without delete", async done => {
      const t = Date.now();
      setTimeout(() => cache.set("hello", "1"), functionWait / 2);
      await expect(
        cache.waitKey("hello", functionWait, false, 10 * multiplicator)
      ).resolves.toBe("1");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait / 2);
      expect(Date.now() - t).toBeLessThan(functionWait);
      await expect(cache.get("hello")).resolves.toBe("1");
      done();
    });

    test("call success", async done => {
      const fn = async () => {
        await sleep(functionWait);
        return "1";
      };
      let t = Date.now();
      await expect(cache.call("hello", fn)).resolves.toBe("1");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);
      await expect(cache.get("hello")).resolves.toMatchObject({ result: "1" });

      t = Date.now();
      await expect(cache.call("hello", fn)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);

      done();
    });

    test("call error", async done => {
      let t = Date.now();
      await expect(cache.call("hello", fnFailed)).rejects.toThrowError(
        "failed"
      );
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);
      await expect(cache.get("hello")).resolves.toMatchObject({
        error: "failed"
      });

      t = Date.now();
      await expect(cache.call("hello", fnFailed)).rejects.toThrowError(
        "failed"
      );
      expect(Date.now() - t).toBeLessThan(functionWait);

      cache.setOptions({ errorTtl: null });
      t = Date.now();
      await expect(cache.call("hello", fnFailed)).rejects.toThrowError(
        "failed"
      );
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);

      done();
    });

    test("call success locked", async done => {
      cache.setOptions({
        simultanLockTimeout: 200 * multiplicator,
        simultanLockTimeoutSleep: 10 * multiplicator
      });
      const t1 = Date.now();
      const t2 = Date.now();
      expect(cache.call("hello", fn1))
        .resolves.toBe("1")
        .then(() => {
          expect(Date.now() - t1).toBeGreaterThanOrEqual(functionWait);
        });
      await sleep(10);
      await expect(cache.call("hello", fn2)).resolves.toBe("1");
      expect(Date.now() - t2).toBeGreaterThanOrEqual(functionWait);

      let t = Date.now();
      await expect(cache.call("hello", fn2)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);

      await sleep(options.ttl);
      t = Date.now();
      await expect(cache.call("hello", fn2))
        .resolves.toBe("2")
        .then(() => {
          expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);
        });

      done();
    });

    test("call success locked timeout", async done => {
      cache.setOptions({
        simultanLockTimeout: functionWait / 2,
        simultanLockTimeoutSleep: 10 * multiplicator
      });
      const t1 = Date.now();
      const t2 = Date.now();
      expect(cache.call("hello", fn1))
        .resolves.toBe("1")
        .then(() => {
          expect(Date.now() - t1).toBeGreaterThanOrEqual(functionWait);
        });
      await sleep(10);
      await expect(cache.call("hello", fn2))
        .resolves.toBe("2")
        .then(() => {
          expect(Date.now() - t2).toBeGreaterThanOrEqual(functionWait);
        });

      let t = Date.now();
      await expect(cache.call("hello", fn2)).resolves.toBe("2");
      expect(Date.now() - t).toBeLessThan(functionWait);

      done();
    });

    test("call success locked with error and refresh error store", async done => {
      cache.setOptions({
        simultanLockTimeout: functionWait / 2,
        simultanLockTimeoutSleep: 10 * multiplicator,
        refreshInterval,
        storeRefreshErrors: true
      });
      let t = Date.now();
      await expect(cache.call("hello", fn1)).resolves.toBe("1");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);

      t = Date.now();
      await expect(cache.call("hello", fn2)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);
      await sleep(refreshInterval);

      t = Date.now();
      await expect(cache.call("hello", fnFailed)).rejects.toThrowError(
        "failed"
      );
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);

      t = Date.now();
      await expect(cache.call("hello", fn2)).rejects.toThrowError("failed");
      expect(Date.now() - t).toBeLessThan(functionWait);

      done();
    });

    test("call success locked with error and refresh without store", async done => {
      cache.setOptions({
        simultanLockTimeout: functionWait / 2,
        simultanLockTimeoutSleep: 10 * multiplicator,
        refreshInterval,
        storeRefreshErrors: false
      });
      let t = Date.now();
      await expect(cache.call("hello", fn1)).resolves.toBe("1");
      expect(Date.now() - t).toBeGreaterThanOrEqual(functionWait);

      t = Date.now();
      await expect(cache.call("hello", fn2)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);
      await sleep(refreshInterval - functionWait);

      t = Date.now();
      await expect(cache.call("hello", fnFailed)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);

      t = Date.now();
      await expect(cache.call("hello", fn2)).resolves.toBe("1");
      expect(Date.now() - t).toBeLessThan(functionWait);

      done();
    });
  });
}
