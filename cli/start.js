const path = require("path");
const { flatten, uniqBy } = require("lodash");
const { serveAddons } = require("..");

const requireAddons = pathStr => {
    const requiredFile = require(pathStr);

    const sources = [requiredFile, ...Object.values(requiredFile)];

    const addons = sources.filter(addon => {
        try {
            addon.getProps();
            return true;
        } catch (e) {
            return false;
        }
    });

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
    const addons = uniqBy(
        flatten(files.map(file => requireAddons(path.resolve(cwd, file)))),
        _ => _.getProps().id
    );

    serveAddons(addons);
};

main();
