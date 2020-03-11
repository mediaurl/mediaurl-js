# WATCHED.com SDK and tools

This monorepo includes all javascript modules needed to create easily addons for WATCHED.

## Status of this project

The WATCHED API and the SDK is still not yet stable, so there might be further updates which will require you to update or change your code.

## Getting started

The most easy way to create a new addon is with our wizard:

```shell
npx @watchedcom/create my-addon
```

Now check out the `src/index.ts` script and make some changes. Then start the addon server:

```shell
npm run develop
```

### Test with the WATCHED app

1. Open the WATCHED app on your mobile and go to the `Add Addon` screen, where you can enter a URL.
2. Enter the IP address of your computer. For example `192.168.1.123`, or with port number `192.168.1.123:1234`. On local IP addresses, the port `3000` as well as some other default ports are omitted.

### Record and replay requests

This might be the best choice to create a new addon. Start your developemnt server in the following way:

```shell
npx watched-sdk develop --record test-session
```

This will create a file named `test-session.record.js`. To replay your recording, run this command:

```shell
npx watched-sdk replay --record test-session
```

To reply and watch for changes, use this:

```shell
npx watched-sdk replay --record test-session --watch
```

### Create a test case with a recorded session

Create a test case file, for example `src/record.test.ts`:

```javascript
import { replayRequests } from "@watchedcom/sdk";
import { yourAddon } from "./index";

test(`Replay recorded actions`, done => {
  replayRequests([yourAddon], "test-session.record.js")
    .then(done)
    .catch(done);
});
```

Now run the tests:

```shell
npm run test
```

### Testing with the `testAddon` function

This function will try to figure out some actions your addon provides and is doing some tests. It's an easy and quick way, especially for addons which provide a `directory` action.

Our addon creation wizard can create such a test automatically for you. Run this test with:

```shell
npm run test
```

## Translate your addon

For some suggestions regaring translations, please see either our `@watchedcom/i18n` package found inside `packages/i18n`, or the documentation at `docs/translations.md`.

## Deploy your addon

To make your addon open to the public, you need to run it somewhere on the internet. We are working on giving an as easy as possible tutorial for a wide range of affordable or free hosting providers.

## Cache

Caching can have many benefits for server processes. With the `ctx.cache` function you have access to an `CacheHandler` instance. Please see the function documentation for more infos about this.

By default, all cache keys get's prefixed with the addon ID, the addon's major version code and the current action. You can change this by changing the `prefix` option.

Currently there are the following caching engines available:

### `MemoryCache`

In memory cache, this is the default.

### `DiskCache`

A cache which uses the file system for storage. To enable this, set the environment variable `DISK_CACHE` to a path.

```shell
export DISK_CACHE=/data/watched-cache
npm run develop
```

### `RedisCache`

This cache engine is using the [redis](https://www.npmjs.com/package/redis) package. To activate it, set the environment variable `REDIS_CACHE` to a redis connection URL.

```shell
export REDIS_CACHE=redis://localhost
npm run develop
```

## Developing on this repo

Clone this repo and bootstrap it with `lerna`:

```shell
npx lerna bootstrap --hoist
```

TODO: Add more infos on how to start developing.
