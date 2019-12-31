#!/usr/bin/env node
const program = require("commander");
const path = require("path");
const { serveAddons } = require("..");

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

// test with
// cli/index.js serve examples/javascript

program.command("serve [files...]").action(files => {
    if (files.length === 0) files.push(".");
    const cwd = process.cwd();
    const addons = files.map(file => requireAddon(path.resolve(cwd, file)));
    serveAddons(addons);
});

program.parse(process.argv);
