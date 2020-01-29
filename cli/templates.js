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

const addonProps = ({ name, requestArgs, itemTypes }) => {
    return {
        id: name,
        version: "1.0.0",
        name,
        itemTypes,
        requestArgs
    };
};

const handlersBlock = (addonVar, actions) =>
    actions
        .map(action => {
            return `${addonVar}.registerActionHandler("${action}", ${action}Handler);`;
        })
        .join("\n\n");

const indexTs = input => {
    const { name, actions } = input;

    const addonVar = `${name}Addon`;

    const content = `import { createWorkerAddon } from "@watchedcom/sdk";

import { ${actions
        .map(action => `${action}Handler`)
        .join(", ")} } from "./handlers";

export const ${addonVar} = createWorkerAddon(${JSON.stringify(
        addonProps(input),
        null,
        4
    )});

${handlersBlock(addonVar, actions)}
`;

    return content;
};

const indexJs = input => {
    const { name, actions } = input;

    const addonVar = `${name}Addon`;

    const content = `const { createWorkerAddon } = require("@watchedcom/sdk");
const { ${actions
        .map(action => `${action}Handler`)
        .join(", ")} } = require("./handlers");

const ${addonVar} = createWorkerAddon(${JSON.stringify(
        addonProps(input),
        null,
        4
    )});

${handlersBlock(addonVar, actions)}

module.exports = ${addonVar};
`;

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

const handlersJs = ({ actions }) => {
    const handlersBlock = actions
        .map(
            action =>
                `const ${action}Handler = async (input, ctx) => {
    // ${action} action handler code goes here
    throw new Error("Not implemented");
};`
        )
        .join("\n\n");
    const content = `${handlersBlock}

module.exports = { ${actions.map(action => `${action}Handler`).join(", ")} };
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

const packageJsonCommon = ({ name }) => {
    return {
        name: "addon-" + kebabCase(name),
        version: "1.0.0"
    };
};

const packageJsonTs = input =>
    JSON.stringify(
        {
            ...packageJsonCommon(input),
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
    );

const packageJsonJs = input =>
    JSON.stringify(
        {
            ...packageJsonCommon(input),
            main: "src/index.js",
            scripts: {
                start: "watched-sdk start --prod",
                develop: "watched-sdk start"
            },
            dependencies: {
                "@watchedcom/sdk": "latest"
            }
        },
        null,
        2
    );

const tsProject = {
    "tsconfig.json": tsConfigJson,
    "package.json": packageJsonTs,
    ".gitignore": ["node_modules", ".env", "dist"].join("\n"),
    "src/index.ts": indexTs,
    "src/handlers.ts": handlersTs,
    ".env.example": envExample,
    "README.md": readme
};

const jsProject = {
    "package.json": packageJsonJs,
    ".gitignore": ["node_modules", ".env"].join("\n"),
    "src/index.js": indexJs,
    "src/handlers.js": handlersJs,
    ".env.example": envExample,
    "README.md": readme
};

module.exports = { executeProjectTemplate, tsProject, jsProject };
