#!/usr/bin/env node
const program = require("commander");
const dev = require("ts-node-dev");
const fork = require("child_process").fork;
const path = require("path");
const { guessTsMain } = require("guess-ts-main");

const startScriptPath = path.resolve(__dirname, "start");

program
    .option("--prod", "Start the server in production mode")
    .command("start [files...]")
    .description("Start the WATCHED SDK server")
    .action(files => {
        let tsConfig = null;

        try {
            tsConfig = require(path.resolve(process.cwd(), "tsconfig.json"));
        } catch {}

        // It's a ts project and we want to start ts version instead
        if (tsConfig && files.length === 0) {
            files.push(guessTsMain(process.cwd()));
        }

        console.log({ "Serving addons": files, "Live reload": !program.prod });

        return program.prod
            ? fork(startScriptPath, files)
            : dev(startScriptPath, files, [], { notify: false });
    });

program.on("command:*", function() {
    program.outputHelp();
    process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
