# Changelog

## v0.31.0

### Changes

- Created `CHANGELOG.md`

### Legacy

- The `watched-sdk` command line tool will be legacy starting with v0.32
- The [`@watchedcom/create`](packages/create) command line tool is printing a legacy message
- The `testAddon` function in [`@watchedcom/test`](packages/test) is printing a legacy message when it's used

### Upgrade instructions

Since the `watched-sdk` command is legacy, you can't export your addons anymore.

- **`package.json`** (change the `start` and `develop` scripts)

  ```json
  {
    "scripts": {
      "build": "tsc",
      "start": "node .",
      "develop": "ts-node-dev --transpileOnly src",
      "test": "jest"
    }
  }
  ```

- **`src/index.ts`**

  ```ts
  import { runCli } from "@watchedcom/sdk";

  // Your code here

  runCli([yourAddon, anotherAddon]);
  ```
