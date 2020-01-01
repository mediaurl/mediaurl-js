#!/usr/bin/env node
const program = require("commander");
const dev = require('ts-node-dev')
const fork = require('child_process').fork
const path = require("path");
const {guessTsMain} = require('guess-ts-main')

const serveScriptPath = path.resolve(
    __dirname,
    'serve'
)


program
    .option('--prod', 'Serve js files with node')
    .command("serve [files...]")
    .action(files => {
        let tsConfig = null;

        try {
            tsConfig = require(
                path.resolve(
                    process.cwd(),
                    'tsconfig.json'
                )
            )
        } catch { }

        // It's a ts project and we want to serve ts version instead
        if (tsConfig && files.length === 0) {
            files.push(guessTsMain(process.cwd()))
        }

        console.log({ 'Serving addons': files, 'Live reload': !program.prod });

        return program.prod
            ? fork(
                serveScriptPath, files
            )
            : dev(
                serveScriptPath,
                files,
                [],
                { notify: false }
            )
    });

program.parse(process.argv);
