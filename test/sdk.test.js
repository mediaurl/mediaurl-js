const Sdk = require("../");

const exported = [
    "start",
    "startServer",
    "startCli",
    "Addon",
    "createAddon",
    "createRepository",
    "getCache",
    "setCache"
];

test("SDK should export all needed methods and properties", () => {
    expect(exported.every(key => Sdk[key])).toBeTruthy();
});
