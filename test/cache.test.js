const { NullCache } = require("../dist/cache/NullCache");

const key = "test_key";
const value = { hello: "world" };

test("Test NullCache API", async () => {
    const cache = new NullCache();
    expect(await cache.set(key, value)).toEqual(value);
    expect(await cache.get(key)).toEqual(null);
});
