const path = require("path");
const fs = require("fs-extra");
const { kebabCase } = require("lodash");

const executeProjectTemplate = async (template, basePath, input) => {
    for (const filePath of Object.keys(template)) {
        const targetPath = path.resolve(basePath, ...filePath.split("/"));
        const data = template[filePath];
        await fs.outputFile(
            targetPath,
            typeof data === "function" ? data(input) : data
        );
    }
};

const tsConfigJson = `{
    "compilerOptions": {
        "target": "es5",
        "strictNullChecks": true,
        "outDir": "dist"
    },
    "include": ["src/index.ts"]
}`;

const indexTs = ({ name, actions, itemTypes, requestArgs }) => {
    const addonVar = `${name}Addon`;

    const handlersBlock = actions
        .map(action => {
            return `${addonVar}.registerActionHandler("${action}", ${action}Handler);`;
        })
        .join("\n\n");

    const addonProps = {
        id: name,
        version: "1.0.0",
        name: name,
        flags: {
            adult: false
        },
        requestArgs,
        actions,
        itemTypes
    };

    const content = `import { createWorkerAddon } from "@watchedcom/sdk";

import { ${actions
        .map(action => `${action}Handler`)
        .join(", ")} } from "./handlers";

export const ${addonVar} = createWorkerAddon(${JSON.stringify(
        addonProps,
        null,
        4
    )});

${handlersBlock}`;

    return content;
};

const handlersTs = ({ actions }) => {
    const handlersBlock = actions
        .map(
            action =>
                `export const ${action}Handler: WorkerHandlers["${action}"] = async (input, ctx) => {
    // ${action} action handler code goes here
    throw new Error("Not implemented");
};`
        )
        .join("\n\n");
    const content = `import { WorkerHandlers } from "@watchedcom/sdk";

${handlersBlock}
`;
    return content;
};

const envExample = `# Used in development
# Rename to .env and set your vars
NODE_ENV=development`;

const readme = ({ name }) => {
    const content = `# ${name} addon for WATCHED.com

\`\`\`shell
npm i
npm run develop
\`\`\`
`;

    return content;
};

const tsProject = {
    "tsconfig.json": tsConfigJson,
    "package.json": ({ name }) =>
        JSON.stringify(
            {
                name: "addon-" + kebabCase(name),
                version: "1.0.0",
                main: "dist",
                scripts: {
                    build: "tsc -p .",
                    start: "watched-sdk start --prod",
                    develop: "watched-sdk start"
                },
                dependencies: {
                    "@watchedcom/sdk": "latest"
                },
                devDependencies: {
                    typescript: "latest"
                }
            },
            null,
            2
        ),
    ".gitignore": ["node_modules", ".env", "dist"].join("\n"),
    "src/index.ts": indexTs,
    "src/handlers.ts": handlersTs,
    ".env.example": envExample,
    "README.md": readme
};

module.exports = { executeProjectTemplate, tsProject };
