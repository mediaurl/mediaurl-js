#!/usr/bin/env node
const program = require("commander");
const path = require("path");
const { serveAddons } = require("..");

program.command("serve [file]").action(file => {
    console.log({ cwd: process.cwd() });

    const required = require(process.cwd());

    const addon = required.default || required;

    serveAddons([addon]);
});

program.parse(process.argv);
