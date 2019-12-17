const Sdk = require("../");

const exported = [
    "createWorkerAddon",
    "createRepositoryAddon",
    "createBundleAddon",
    "generateRouter",
    "serveAddons"
];

test("SDK should export all needed methods and properties", () => {
    expect(exported.every(key => Sdk[key])).toBeTruthy();
});
