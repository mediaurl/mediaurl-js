#!/usr/bin/env node
const program = require("commander");
const path = require("path");
const { serveAddons } = require("..");

const cwd = process.cwd();

const requireAddon = pathStr => {
    const requiredFile = require(pathStr);
    return requiredFile.default || requiredFile;
};

program.command("serve [files...]").action(files => {
    // console.log({ cwd, files });

    const addons = files.length
        ? files.map(file => {
              return requireAddon(path.resolve(cwd, file));
          })
        : [requireAddon(cwd)];

    try {
        addons.forEach(addon => addon.getProps());
    } catch (error) {
        throw new Error(`Some of files is not Watched addon`);
    }

    serveAddons(addons);
});

program.parse(process.argv);
