# MediaURL i18n module

Helper module to quickly set up translations for addons.

By default the [i18next-node-fs-backend](https://github.com/i18next/i18next-node-fs-backend) backend for `i18next` is used.

If you set the environment variables `LOCIZE_PROJECTID` and `LOCIZE_API_KEY`, the [i18next-node-locize-backend](https://github.com/locize/i18next-node-locize-backend) backend will be used.

## Installation

```shell
npm i --save @mediaurl/i18n
```

## Configuration

Run the `init` function somewhere at the beginning of your script. There are some default options set (see `src/index.ts`) which can be overwritten.

## Usage of the `t` function

Sometimes you may need direct access to the `t` function of i18next. This is how it's done with this module:

```javascript
import { changeLanguage } from "@mediaurl/i18n";

i18n.init({
  ["en", "fr", "tr"],
  { debug: true }
});

const someFunction = async () => {
  const t = await changeLanguage("en");
  console.log(t("some.key", "Some translated text"));
};
```

## Usage for addons

Mainly translations are needed for the addon metadata defined at the createAddon funcitons. There are two recommended ways to translate this data.

### 1. With the `addon` action handler

```javascript
import { createWorkerAddon, translateDeep } from "@mediaurl/sdk";
import * as i18n from "@mediaurl/i18n";

i18n.init({
  ["en", "fr", "tr"],
  { debug: true }
});

export const myAddon = createWorkerAddon({
  id: "i18n-example",
  name: "i18n:Name of this addon"
});

myAddon.registerActionHandler("addon", async (input, ctx, addon) => {
  const t = await changeLanguage(input.language);
  return translateDeep(addon.getProps(), t);
});
```

### 2. With an exported promise

The addon server supports resolving exported promises. This promises can return an addon or an array of addons.

Also we can benefit from the `TranslatedText` system. The `tAll` function will get all available translations for a key.

```javascript
import { createWorkerAddon, translateDeep } from "@mediaurl/sdk";
import { tAll } from "@mediaurl/i18n";

export default (async () => {
  await i18n.init({
    ["en", "fr", "tr"],
    { debug: true }
  });

  const myAddon = createWorkerAddon(translateDeep(
    {
      id: "i18n-example",
      name: "i18n:Name of this addon"
    },
    tAll
  ));

  return myAddon;
});
```

## Download translations from locize

If you choose to use locize, you should add your translations to your prjecct root, especially when you are using a serverless environment.

First install the `locize-cli`:

```shell
npm i --save-dev locize-cli
```

Then modify your `package.json`:

```json
{
  "scripts": {
    "update-locize": "node -r dotenv/config node_modules/.bin/locize download --path locales --clean=true -n tmdb"
  }
}
```
