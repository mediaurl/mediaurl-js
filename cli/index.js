#!/usr/bin/env node
const program = require("commander");
const fork = require("child_process").fork;
const path = require("path");
const fs = require("fs");
const { guessTsMain } = require("guess-ts-main");

const startScriptPath = path.resolve(__dirname, "start");

const cwd = process.cwd();

program
    .option("--prod", "Start the server in production mode")
    .command("start [files...]")
    .description("Start the WATCHED SDK server")
    .action(files => {
        let tsConfig = null;

        try {
            tsConfig = require(path.resolve(cwd, "tsconfig.json"));
        } catch {}

        if (program.prod && files.length === 0) {
            files.push(cwd);
        }

        // It's a ts project and we want to start ts version instead
        if (tsConfig && files.length === 0) {
            files.push(guessTsMain(cwd));
        }

        console.log({ "Serving addons": files, "Live reload": !program.prod });

        // Workaround to support sdk-javascript to be linked to another project
        let execPath = "./node_modules/.bin/ts-node-dev";
        if (!fs.existsSync(execPath)) {
            execPath = path.join(
                __dirname,
                "..",
                "node_modules",
                ".bin",
                "ts-node-dev"
            );
            if (!fs.existsSync(execPath)) {
                throw new Error(`ts-node-dev not found in any location`);
            }
        }

        return fork(
            startScriptPath,
            files,
            program.prod
                ? undefined
                : {
                      execPath,
                      execArgv: ["--no-notify"]
                  }
        );
    });

program.on("command:*", function() {
    program.outputHelp();
    process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
