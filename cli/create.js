const path = require("path");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const { camelCase } = require("lodash");

const { executeProjectTemplate, tsProject, jsProject } = require("./templates");

const projectsMap = {
    ts: tsProject,
    js: jsProject
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
        template: "ts",
        name: defaultName,
        actions: ["directory", "item"],
        itemTypes: ["movie", "series"]
    };

    const userInput = await inquirer
        .prompt(
            force
                ? []
                : [
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
                  ].filter(_ => _)
        )
        .then(responses => ({ ...defaults, template, ...responses }));

    const projectTemplate = projectsMap[userInput.template];
    if (!projectTemplate) {
        throw new Error(`${userInput.template} template not supported`);
    }

    // console.log(userInput);

    await executeProjectTemplate(projectTemplate, addonPath, userInput);
};

module.exports = { createHandler };
