const path = require("path");
const fs = require("fs-extra");
const { kebabCase } = require("lodash");

const executeProjectTemplate = async (template, basePath, input) => {
  for (const filePath of Object.keys(template)) {
    const targetPath = path.resolve(basePath, ...filePath.split("/"));
    const data = template[filePath];
    const content = typeof data === "function" ? data(input) : data;
    if (content) await fs.outputFile(targetPath, content);
  }
};

const addonProps = ({ name, requestArgs, itemTypes }) => {
  return {
    id: name,
    name,
    version: "1.0.0",
    itemTypes: itemTypes.length > 0 ? itemTypes : undefined,
    requestArgs: requestArgs.length > 0 ? requestArgs : undefined
  };
};

const indexHandlers = (addonVar, actions) =>
  actions
    .map(action => {
      return `${addonVar}.registerActionHandler("${action}", async (input, ctx) => {
  // ${action} action handler code goes here
  throw new Error("Not implemented");
});`;
    })
    .join("\n\n");

const tsIndex = input => {
  const { name, actions } = input;
  const addonVar = `${name}Addon`;
  const content = `import { createWorkerAddon } from "@watchedcom/sdk";

export const ${addonVar} = createWorkerAddon(${JSON.stringify(
    addonProps(input),
    null,
    2
  )});

${indexHandlers(addonVar, actions)}
`;
  return content;
};

const jsIndex = input => {
  const { name, actions } = input;
  const addonVar = `${name}Addon`;
  const content = `const { createWorkerAddon } = require("@watchedcom/sdk");

const ${addonVar} = createWorkerAddon(${JSON.stringify(
    addonProps(input),
    null,
    2
  )});

${indexHandlers(addonVar, actions)}

module.exports = ${addonVar};
`;

  return content;
};

const envExample = `# Used in development
# Rename to .env and set your vars
NODE_ENV=development
`;

const readme = ({ name }) => {
  const content = `# ${name} addon for [WATCHED.com](https://www.watched.com)

For more infos about WATCHED addons, please see our [WATCHED.com developer infos](https://www.watched.com/developer).
This addon was created with the [WATCHED javascript SDK](https://github.com/watchedcom/sdk-javascript).

## Start the development addon server

\`\`\`shell
npm i
npm run develop
\`\`\`
`;

  return content;
};

const packageJson = input => {
  const ts = input.template === "ts";
  let data = {
    name: "addon-" + kebabCase(input.name),
    version: "1.0.0",
    main: ts ? "dist" : "src/index.js",
    scripts: {
      build: ts ? "tsc -p ." : undefined,
      start: "watched-sdk start --prod",
      develop: "watched-sdk start"
    },
    dependencies: {
      "@watchedcom/sdk": "latest"
    }
  };
  if (ts) {
    data.devDependencies = {
      ...data.devDependencies,
      typescript: "latest"
    };
  }
  if (input.lintConfig) {
    data.devDependencies = {
      ...data.devDependencies,
      husky: "latest",
      "lint-staged": "latest",
      prettier: "latest"
    };
    data = {
      ...data,
      husky: {
        hooks: {
          "pre-commit": "lint-staged"
        }
      },
      "lint-staged": {
        "*.{js,ts,tsx,css,md}": ["prettier --write", "git add"]
      }
    };
  }

  return JSON.stringify(data, null, 2);
};

const tsConfigJson = () =>
  JSON.stringify(
    {
      compilerOptions: {
        target: "es5",
        strictNullChecks: true,
        outDir: "dist"
      },
      include: ["src/index.ts"]
    },
    null,
    2
  );

const templateMap = {
  js: {
    "README.md": readme,
    "package.json": packageJson,
    ".gitignore": ["node_modules", ".env"].join("\n"),
    ".env.example": envExample,
    "src/index.js": jsIndex
  },
  ts: {
    "README.md": readme,
    "package.json": packageJson,
    ".gitignore": ["node_modules", ".env", "dist"].join("\n"),
    ".env.example": envExample,
    "tsconfig.json": tsConfigJson,
    "src/index.ts": tsIndex
  }
};

module.exports = { executeProjectTemplate, templateMap };
