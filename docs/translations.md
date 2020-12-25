# Translations of addons

Addons should be multilangual if possible. For this problem we have various solutions.

## Using `TranslatedText`

The most easy way to translate an addon is via values with the type `TranslatedText`.
This type supports either a string of text, or a mapping of language=>text pairs.

```json
{
  "sometext": "This is some text which is not translated",
  "othertext": {
    "en": "This is some english text",
    "de": "Das ist die deutsche Übersetzung",
    "cn": "这是一些中文文本"
  }
}
```

## Using `@mediaurl/i18n`

Short after this documentation was written, I created a little helper module for `i18next`. Please see the documentation at `packages/i18n/README.md`.

## Using `i18next`

The [i18next](https://www.i18next.com/) module is an easy way to translate projects of any size.

### Using the [i18next-node-fs-backend](https://github.com/i18next/i18next-node-fs-backend) storage backend

```shell
npm i --save i18next i18next-node-fs-backend
```

Create a file named `src/i18n.ts`:

```javascript
import i18next from "i18next";
import FsBackend from "i18next-node-fs-backend";
import path from "path";

i18next.use(
  new FsBackend(null, {
    loadPath: path.join("locales", "{{lng}}", "{{ns}}.json"),
    addPath: path.join("locales", "{{lng}}", "{{ns}}.missing.json"),
    jsonIndent: 2,
  })
);

i18next.init({
  debug: false,
  fallbackLng: "en",
  whitelist: ["en", "de"],
  ns: ["your-addon-id"],
  defaultNS: "your-addon-id",
  load: "languageOnly",
  saveMissing: true,
  updateMissing: true,
});

export const i18n = i18next;
```

Inside your action handler, you can use this to get an instance to the `t` function:

```javascript
import { i18n } from "./i18n";
const t = await i18n.cloneInstance().changeLanguage(input.language);
const translated = t("some.key", "Some default text");
```

### Using the [locize](https://www.locize.io/) translation service

This example will use the [i18next-node-locize-backend](https://github.com/locize/i18next-node-locize-backend) storage backend, and environment variables for configuration.

When this environment variables are missing, it will fall back to the `i18next-node-fs-backend`. This is the best way to deploy projects to for example serverless environments. For more infos regarding this, click [here](https://github.com/locize/i18next-node-locize-backend#important-advice-for-serverless-environments---aws-lambda-google-cloud-functions-azure-functions-etc).

```shell
npm i --save i18next i18next-node-fs-backend i18next-node-locize-backend
npm i --save-dev locize-cli
```

Your `src/i18n.js` file:

```javascript
import i18next from "i18next";
import FsBackend from "i18next-node-fs-backend";
import LocizeBackend from "i18next-node-locize-backend";
import path from "path";

if (process.env.LOCIZE_PROJECTID) {
  i18next.use(
    new LocizeBackend({
      projectId: <string>process.env.LOCIZE_PROJECTID,
      apiKey: process.env.LOCIZE_API_KEY,
      version: process.env.LOCIZE_VERSION ?? "latest"
    })
  );
} else {
  i18next.use(
    new FsBackend(null, {
      loadPath: path.join("locales", "{{lng}}", "{{ns}}.json"),
      addPath: path.join("locales", "{{lng}}", "{{ns}}.missing.json"),
      jsonIndent: 2
    })
  );
}

i18next.init({
  debug: false,
  fallbackLng: "en",
  whitelist: ["en"],
  ns: ["your-addon-id"],
  defaultNS: "your-addon-id",
  load: "languageOnly",
  saveMissing: true,
  updateMissing: true
});

export const i18n = i18next;
```

Modify your `package.json` and add the following script:

```json
{
  "scripts": {
    "update-locize": "node -r dotenv/config node_modules/.bin/locize download --path locales --clean=true"
  }
}
```

Start your project with setting the environment variables for locize. After using your addon, the translations should appear inside your locize project. Add some languages, translate the strings, and download the updates:

```shell
npm run update-locize
```

After this you can deploy your addon without using locize. This has many benefits, especially for serverless environments.

## Applying translations to an object

Imagine you want to translate the `name` property of this addon:

```javascript
import { createWorkerAddon } from "@mediaurl/sdk";

export const myAddon = createWorkerAddon({
  id: "i18n-example",
  name: "Name of this addon",
});
```

We created a helper function named `translateDeep` for cases like this. This function works similar to the `lodash.cloneDeep` function, but translates all strings beginning with a specific prefix (by default `i18n:`) using the `t` parameter.

```javascript
import { createWorkerAddon, translateDeep } from "@mediaurl/sdk";
import { i18n } from "./i18n";

export const myAddon = createWorkerAddon({
  id: "i18n-example",
  name: "i18n:Name of this addon",
});

myAddon.registerActionHandler("addon", async (input, ctx, addon) => {
  const t = await i18n.cloneInstance().changeLanguage(input.language);
  return translateDeep(addon.getProps(), t);
});
```
