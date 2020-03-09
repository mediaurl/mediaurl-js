# WATCHED.com puppeteer support

This module gives easy access to puppeteer to help scraping websites.

It has a special router integrated which allows fine grained control of how and if resources are losed.

## Setup

The recommended way to setup puppeteer is with a few [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugins enabled.

```shell
npm i --save @watchedcom/puppeteer puppeteer-core puppeteer-extra puppeteer-extra-plugin-anonymize-ua puppeteer-extra-plugin-stealth
# To install chromium
npm i --save puppetter
```

Inside your addon, add this code. In this example, two `puppeteer-extra` plugins are used.

```typescript
import { createPool } from "@watchedcom/puppeteer";
import puppeteer from "puppeteer-extra";
import AnonymizeUserAgentPlugin from "puppeteer-extra-plugin-anonymize-ua";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin({}));
puppeteer.use(AnonymizeUserAgentPlugin());

const pool = createPool(async () => {
  return puppeteer.launch();
});
```

## Usage

There are some utility functions which will make the usage of puppeteer a little more easy.

```javascript
addon.registerActionHandler("item", async (input, ctx) => {
  const ruleOptions = {
    ctx,
    rules: [
      { url: [input.url, "example.com/api"], action: "allow" },
      { url: "example.com/js", action: "allow", cache: true }
    ],
    blockPopups: true
  };

  // The traditional way
  const page = await pool.acquirePage(ruleOptions);
  try {
    await page.open(input.url);
    return await page.content();
  } finally {
    await page.release();
  }

  // Helper function which handles aquire and release
  return await pool.callPage(options, async page => {
    await page.goto(input.url);
    return await page.content();
  });

  // Helper function which returns the page contents
  return await pool.getPageContent(options, input.url);
});
```

## Callbacks inside page rules

To catch one specific URL and return it from an action handler, the following recipe might help you:

```javascript
addon.registerActionHandler("resolve", async (input, ctx) => {
  // outerPromise is a helper to handle this kind of situations.
  // See the documentation of this function for more infos.
  const p = outerPromise(5000);

  const options = {
    ctx,
    rules: [
      { url: [input.url, "example.com/api"], action: "allow" },
      { url: "example.com/js", action: "allow", cache: true },
      {
        resourceType: "media",
        url: "example.com/mediapath/",
        action: async request => {
          const url = await request.url();
          p.resolve(url);
        }
      }
    ],
    blockPopups: true
  };

  // Load the page
  await pool.getPageContent(options, input.url);

  // Wait for the promise
  return await p.promise;
});
```
