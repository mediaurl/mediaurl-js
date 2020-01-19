#!/usr/bin/env node
const program = require("commander");
const fork = require("child_process").fork;
const path = require("path");
const { guessTsMain } = require("guess-ts-main");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const { camelCase } = require("lodash");

const { executeProjectTemplate, tsProject } = require("./templates");

const startScriptPath = path.resolve(__dirname, "start");

const cwd = process.cwd();

const startHandler = (files, cmdObj) => {
    let tsConfig = null;

    try {
        tsConfig = require(path.resolve(cwd, "tsconfig.json"));
    } catch {}

    if (cmdObj.prod && files.length === 0) {
        files.push(cwd);
    }

    // It's a ts project and we want to start ts version instead
    if (tsConfig && files.length === 0) {
        files.push(guessTsMain(cwd));
    }

    console.log({ "Serving addons": files, "Live reload": !cmdObj.prod });

    const execPath = path.resolve(cwd, "node_modules", ".bin", "ts-node-dev");

    return fork(
        startScriptPath,
        files,
        cmdObj.prod
            ? undefined
            : {
                  execPath,
                  execArgv: ["--no-notify", "--transpileOnly"]
              }
    );
};

const createHandler = async (folderName, cmdObj) => {
    const { template, force } = cmdObj;
    // console.log("inside createHandler", folderName, { template, force });

    const addonPath = path.resolve(process.cwd(), folderName);

    const folderExists = await fs.pathExists(addonPath);

    if (folderExists) {
        throw new Error("Folder already exists");
    }

    const defaultName = camelCase(folderName);

    const defaults = {
        name: defaultName,
        actions: ["directory", "item"],
        itemTypes: ["movie", "series"]
    };

    const userInput = await inquirer
        .prompt(
            [
                template
                    ? null
                    : {
                          type: "list",
                          choices: [
                              { name: "TypeScript", value: "ts" },
                              { name: "JavaScript", value: "js" }
                          ],
                          name: "template",
                          default: 0
                      },
                ...(force
                    ? []
                    : [
                          {
                              name: "name",
                              type: "input",
                              default: defaultName
                          },
                          {
                              name: "actions",
                              type: "checkbox",
                              choices: [
                                  "directory",
                                  "item",
                                  "source",
                                  "subtitle",
                                  "resolve"
                              ],
                              default: ["directory", "item"]
                          },
                          {
                              name: "itemTypes",
                              type: "checkbox",
                              choices: [
                                  "movie",
                                  "series",
                                  "directory",
                                  "channel",
                                  "iptv"
                              ],
                              default: ["movie", "series"]
                          },
                          {
                              name: "requestArgs",
                              type: "checkbox",
                              choices: ["imdb_id", "tmdb_id"],
                              default: ["imdb_id", "tmdb_id"],
                              when: ({ actions }) =>
                                  actions.indexOf("source") !== -1
                          }
                      ])
            ].filter(_ => _)
        )
        .then(responses => ({ template, ...defaults, ...responses }));

    if (userInput.template !== "ts") {
        throw new Error("Only TS projects supported for now");
    }

    // console.log(userInput);

    await executeProjectTemplate(tsProject, addonPath, userInput);
};

program
    .command("start [files...]")
    .option("--prod", "Start the server in production mode")
    .description("Start the WATCHED SDK server")
    .action(startHandler);

program
    .command("create <name>")
    .description("Create WATCHED addon folder")
    .option("--template <template>", "js|ts")
    .option("--force")
    .action(createHandler);

program.on("command:*", function() {
    program.outputHelp();
    process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
