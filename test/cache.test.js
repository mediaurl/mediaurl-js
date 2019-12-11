const { NullCache } = require("../dist/cache/NullCache");

const key = "test_key";
const value = { hello: "world" };

jest.setTimeout(5000);

test("Test NullCache API", async () => {
    const cache = new NullCache();

    const { error } = await cache
        .waitKey(key, 1000, true)
        .catch(error => ({ error }));

    expect(await cache.set(key, value)).toEqual(value);
    expect(await cache.get(key)).toEqual(null);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBeTruthy();
    expect(error.message).toMatch(/timed out/);
});
