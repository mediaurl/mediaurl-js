import * as fs from "fs-extra";
import { kebabCase } from "lodash";
import * as path from "path";

export const executeProjectTemplate = async (template, basePath, input) => {
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

const testHandler = addonVar => `// Depending on your addon, change the test timeout
jest.setTimeout(30000);

test("Test addon ${addonVar}", done => {
  testAddon(${addonVar}).then(done).catch(done);
});`;

const tsIndexTest = input => {
  const { name } = input;
  const addonVar = `${name}Addon`;
  const content = `import { testAddon } from "@watchedcom/test";
import { ${addonVar} } from "./index";

${testHandler(addonVar)}
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

const jsIndexTest = input => {
  const { name } = input;
  const addonVar = `${name}Addon`;
  const content = `const { testAddon } = require("@watchedcom/sdk");
const ${addonVar} = require("./index");

${testHandler(addonVar)}
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
  let data: any = {
    name: "addon-" + kebabCase(input.name),
    version: "1.0.0",
    main: ts ? "dist" : "src/index.js",
    scripts: {
      build: ts ? "tsc -p ." : undefined,
      start: "watched-sdk start --prod",
      develop: "watched-sdk start",
      test: input.test ? "jest" : undefined
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

  if (input.test) {
    data.devDependencies = {
      ...data.devDependencies,
      jest: "latest",
      supertest: "latest",
      "@watchedcom/test": "latest"
    };
    if (ts) {
      data.devDependencies = {
        ...data.devDependencies,
        "ts-jest": "latest",
        "@types/jest": "latest"
      };
    }
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

type TemplateMap = {
  [k: string]: {
    [k: string]: string | ((...args) => string);
  };
};

const jestConfig = input => {
  if (!input.test) return "";
  const preset = input.template === "ts" ? "typescript" : "javascript";
  return `module.exports = {
  preset: "./node_modules/@watchedcom/test/jest-presets/${preset}.js",
};
`;
};

export const templateMap: TemplateMap = {
  js: {
    "README.md": readme,
    "package.json": packageJson,
    ".gitignore": ["node_modules", ".env"].join("\n"),
    ".env.example": envExample,
    "jest.config.js": jestConfig,
    "src/index.js": jsIndex,
    "src/index.test.js": jsIndexTest
  },
  ts: {
    "README.md": readme,
    "package.json": packageJson,
    ".gitignore": ["node_modules", ".env", "dist"].join("\n"),
    ".env.example": envExample,
    "tsconfig.json": tsConfigJson,
    "jest.config.js": jestConfig,
    "src/index.ts": tsIndex,
    "src/index.test.ts": tsIndexTest
  }
};
