# MediaURL puppeteer support

This module gives easy access to puppeteer to help scraping websites.

It has a special router integrated which allows fine grained control of how and if resources are losed.

## Setup

The recommended way to setup puppeteer is with a few [puppeteer-extra](https://github.com/berstend/puppeteer-extra) plugins enabled.

```shell
npm i --save @mediaurl/puppeteer puppeteer-core puppeteer-extra puppeteer-extra-plugin-anonymize-ua puppeteer-extra-plugin-stealth
# To install chromium
npm i --save puppetter
```

Inside your addon, add this code. In this example, two `puppeteer-extra` plugins are used.

```typescript
import { setupPageRules } from "@mediaurl/puppeteer";
import puppeteer from "puppeteer-extra";
import AnonymizeUserAgentPlugin from "puppeteer-extra-plugin-anonymize-ua";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin({}));
puppeteer.use(AnonymizeUserAgentPlugin());
```

## Usage

There are some utility functions which will make the usage of puppeteer a little more easy.

```javascript
addon.registerActionHandler("item", async (input, ctx) => {
  const ruleOptions = {
    ctx,
    rules: [
      { url: [input.url, "example.com/api"], action: "allow" },
      { url: "example.com/js", action: "allow", cache: true },
    ],
    blockPopups: true,
  };

  // Get a browser instance
  const browser = await puppeteer.launch();
  try {
    const page = (await browser.pages())[0];

    // Setup the page rules
    setupPageRules(page, ruleOptions);

    // Open the website and return it's content
    await page.open(input.url);
    return await page.content();
  } finally {
    // Close the browser
    await browser.close();
  }
});
```

### Callbacks inside page rules

To catch one specific URL and return it from an action handler, the following recipe might help you:

```javascript
addon.registerActionHandler("resolve", async (input, ctx) => {
  // outerPromise is a helper to handle this kind of situations.
  // See the documentation of this function for more infos.
  const p = outerPromise(5000);

  const pageRules = [
    { url: [input.url, "example.com/api"], action: "allow" },
    { url: "example.com/js", action: "allow", cache: true },
    {
      resourceType: "media",
      url: "example.com/mediapath/",
      action: async (request) => {
        // This action handler will be called during page load
        const url = await request.url();
        p.resolve(url);
      },
    },
  ];

  // Get a browser instance
  const browser = await puppeteer.launch();
  try {
    const page = (await browser.pages())[0];
    setupPageRules(page, ruleOptions);

    // When calling open, the action function will be triggered
    await page.open(input.url);

    // In case the page was loaded without calling the action
    // function, reject the promise
    p.promise.reject(new Error("Action handler was not called"));
  } finally {
    await browser.close();
  }

  // Wait for the promise
  return await p.promise;
});
```
