const path = require("path");
const { serveAddons } = require("../dist");
const { BasicAddon } = require("../dist/addons/BasicAddon");

const requireAddon = (addons, pathStr) => {
    const requiredFile = require(pathStr);
    const add = addon => {
        if (addon && addon instanceof BasicAddon && !addons.includes(addon)) {
            addons.push(addon);
        }
    };
    add(requiredFile.default);
    add(requiredFile);
    Object.values(requiredFile).forEach(addon => add(addon));
    if (addons.length === 0) {
        throw new Error(
            `Script "${pathStr}" does not export any valid WATCHED addons.`
        );
    }
    return addons;
};

const main = () => {
    const files = process.argv.slice(2);

    if (files.length === 0) files.push(".");
    const cwd = process.cwd();
    const addons = [];
    files.forEach(file => requireAddon(addons, path.resolve(cwd, file)));
    serveAddons(addons);
};

main();
