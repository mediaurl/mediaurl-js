# Changelog

## v1.3.0

- Added cassandra caching engine

## v1.2.0

- Updated dependencies
- Switched to exact dependency versions
- Added `cleanup-cache` command line function to run garbage collections
- Removed the the automatic garbage collection of `sql-cache` package

## v1.1.2

- Fixed sql-cache duplicate primary key race conditions

## v1.1.0

- Updated OpenAPI schema
- Renamed worker addon property `requestArgs` to `triggers`
- Task responses can now use the normal action endpoints
- Added @mediaurl/sql-cache module to add support for postgres and mysql backends

### Update instructions

On worker addons, rename the addon property from `requestArgs` to `triggers`.

## v1.0.3

- Added selftest handlers for multi addon servers

## v1.0.2

- Falling back to legacy URL's on `repository` action handler

## v1.0.1

- Added property `endpoints` to `Addon` object
- Created a new URL schema for mediaurl routes

## v1.0.0

- Renamed project to MediaURL
- Moved Redis and MongoDB cache code to external modules
- Allow `.json` extension for HTTP endpoints
- Deprecated the `@mediaurl/i18n` module
- Created new `@mediaurl/test-utils` module with utility functions to test addons and cache modules

### Changes

- Added `SetResultError` to set cache results in a different way. For more infos, see the code documentation.
- Added IPTV category property and default filter values
- Removed the `@mediaurl/create` package
- Removed the `watched-sdk` command line tool
- Added experimental `FetchAgent`

## v0.35.0

### Changes

- Added `SetResultError` to set cache results in a different way. For more infos, see the code documentation.
- Added IPTV category property and default filter values
- Removed the `@mediaurl/create` package
- Removed the `watched-sdk` command line tool
- Added experimental `FetchAgent`

## v0.34.0

### Changes

- Dropping legacy Node.js versions (=> 12.9 is now required)
- Added similar item system for items. See the `similarItem` property. Similar items will be displayed as horizontal lists below movie, series or channel items.
- Created `toast` task to display toast messages inside the app (see `ctx.toast`)
- Created `notification` task to display notifications with various options inside the app (see `ctx.notification`). Notifications can be displayed once every 30 minute per addon. You can set the `url` property to open an URL when the user clicks on the notification. MediaURL sharing URL's are handled internally, so you can promote for example an item or addon.
- Various bugfixes and improvments

### Update instructions

Edit your `tsconfig.json` and replace

```json
  "target": "es5",
```

with

```json
  "target": "es2019",
  "lib": ["es2020"],
  "moduleResolution": "node",
```

## v0.31.0

### Changes

- Created `CHANGELOG.md`

### Legacy

- The `watched-sdk` command line tool will be legacy starting with v0.32
- The [`@mediaurl/create`](packages/create) command line tool is printing a legacy message
- The `testAddon` function in [`@mediaurl/test`](packages/test) is printing a legacy message when it's used

### Update instructions

Since the `watched-sdk` command is legacy, you can't export your addons anymore.

- Install `ts-node-dev`:

  ```shell
  npm install --save-dev ts-node-dev
  ```

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
  import { runCli } from "@mediaurl/sdk";

  // Your code here

  runCli([yourAddon, anotherAddon]);
  ```
