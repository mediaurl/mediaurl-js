import { spawnSync } from "child_process";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import { camelCase } from "lodash";
import * as path from "path";
import { executeProjectTemplate, templateMap } from "./templates";

export const createHandler = async (folderPath: string, cmdObj: any) => {
  const { template, force } = cmdObj;

  const addonPath = path.resolve(process.cwd(), folderPath);
  await fs.ensureDir(addonPath);

  const folderName = path.parse(addonPath).name;
  const folderFiles = await fs.readdir(addonPath);

  // Folder can be empty git repo, so we need to check only visible files
  const nonHiddenFiles = folderFiles.filter(filename => !/^\./.test(filename));

  if (nonHiddenFiles.length > 0) {
    throw new Error("Folder is not empty");
  }

  const defaultName = camelCase(folderName);

  const defaults = {
    template: template || "ts",
    name: defaultName,
    actions: ["directory", "item"],
    itemTypes: ["movie", "series"],
    requestArgs: [],
    lintConfig: true,
    test: false
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
              choices: ["directory", "item", "source", "subtitle", "resolve"],
              default: defaults.actions
            },
            {
              name: "itemTypes",
              type: "checkbox",
              choices: [
                // "directory",
                "movie",
                "series",
                "channel",
                "iptv"
              ],
              default: defaults.itemTypes
            },
            {
              name: "requestArgs",
              type: "checkbox",
              choices: [
                "name,year",
                "name,releaseDate",
                "imdb_id",
                "tmdb_id",
                "tvdb_id",
                "tvrage_id"
              ],
              default: defaults.requestArgs,
              when: ({ actions }) => {
                for (const action of actions) {
                  if (["item", "source", "subtitle"].includes(action)) {
                    return true;
                  }
                }
                return false;
              }
            },
            {
              name: "lintConfig",
              type: "confirm",
              message: "Install linting libraries and git hooks?",
              default: defaults.lintConfig
            },
            {
              name: "test",
              type: "confirm",
              message:
                "Setup automatic addon tests using jest? (Note: This is currently not very stable)",
              default: defaults.test
            }
          ]
    )
    .then(responses => ({ ...defaults, ...responses }));

  const projectTemplate = templateMap[userInput.template];
  if (!projectTemplate) {
    throw new Error(`${userInput.template} template not supported`);
  }

  console.log("[=] Creating addon structure");
  await executeProjectTemplate(projectTemplate, addonPath, userInput);

  console.log("[=] Updating dependencies");
  spawnSync("npx", ["npm-check-updates", "-u"], {
    stdio: "inherit",
    cwd: addonPath
  });

  console.log("[=] Installing dependencies");
  spawnSync("npm", ["i"], { stdio: "inherit", cwd: addonPath });

  console.log("[=] Your addon is ready and set up :-)");
};
