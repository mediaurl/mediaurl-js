const path = require("path");
const { serveAddons } = require("../dist");

const requireAddon = pathStr => {
    const requiredFile = require(pathStr);
    const addon = requiredFile.default || requiredFile;
    try {
        addon.getProps();
    } catch (error) {
        throw new Error(
            `Script "${pathStr}" does not export a valid WATCHED addon.`
        );
    }
    return addon;
};

const main = () => {
    const files = process.argv.slice(2)

    if (files.length === 0) files.push(".");
    const cwd = process.cwd();
    const addons = files.map(file => requireAddon(path.resolve(cwd, file)));
    serveAddons(addons);
}

main();