# WATCHED.com SDK and tools

This monorepo includes all javascript modules needed to create addons for [WATCHED](https://www.watched.com/).

## Getting started

In best way to create your own WATCHED addon is by cloning our example addon and modify it.

### Prerequisites

- [nodejs](https://nodejs.org/) installed on your computer
- A text editor of your choice. Preferred are [vscode](https://code.visualstudio.com/), [atom](https://atom.io/) or [Sublime Text](https://www.sublimetext.com/)
- Basic knowledge in Javascript or Typescript

### Cloning the example addon

The best way to start is to clone our [watched-addon-example](https://github.com/watchedcom/watched-addon-example) addon:

```shell
git clone https://github.com/watchedcom/watched-addon-example.git my-addon
```

Now open the created folder `my-addon` with your editor.

### Running the addon

Without any modifications, let's start the addon and see what will happen.

**1. Start the addon server**

Open your terminal, change to the `my-addon` folder and run:

```shell
npm run develop
```

You should see something like this:

```
> watched-addon-example@0.27.1 develop /home/myname/my-addon
> watched-sdk start

Using ts-node version 8.8.2, typescript version 3.8.3
Mounting addon example
Using cache: MemoryCache
Listening on 3000
```

**2. Enable developer mode**

In order to install addons in the WATCHED app, you first need to _unlock_ it:

1. Open the WATCHED app, go to settings and make sure the **Developer mode** is enabled.
2. Go to the addon manager and deactivate the bundle addon if there is one active.
3. To make things more clean and easy, disabled all currently activated addons.

**3. Add your addon**

1. Find the local IP of your computer.
   _(TODO: Tutorial on how to do this on different OS)_
2. Go to the **Add Addon** screen, where you can enter an URL.
3. Enter the IP address of your computer. For example `192.168.1.123`.
   _On local IP addresses, the port `3000` as well as some other default ports are omitted, so it's enough to only enter your IP._

Go to the start screen and you should see a dashboard of your addon.

### Modify your addon

Open the `src/index.ts` file in your editor and start playing around. The server will restart automatically once you saved a file.

To reload for screens in the app, swipe down until a refresh symbol appears. After the refresh your changes should appear.

When you change the metadata of your addon (like addin a new `item` or `source` handler, or adding new item types to your addon), you need to refresh the addon. To do this, go to the _addon manager_, click on it (I) symbol on the right side of your addon. Within the "addon detail screen", swipe down to refreh your addon.

### Documentation

Much of our documentation is in our code. Depending on your editor you should see much of the documentation while writing or when hovering a variable or function.

Please also check out our object schema here: https://www.watched.com/swagger

### Publish and rename

- Before renaming the ID of your addon, you should deactivate and delete it from the app.

- Edit the name and addon ID in `package.json` and `src/index.ts`.

- Delete all unnecessary action handlers.

## Deploy your addon

Please check our deployment documentation at [docs/deployment.md](https://github.com/watchedcom/watched-js/blob/master/docs/deployment.md).

## Tips for development and testing

We created some tools to make the development of addons more easy.

### Record and replay requests

Start your development server in the following way:

```shell
npx watched-sdk start --record test-session
```

This will create a file named `test-session.record.js` in the current directory. Now load your addon in the app and open directories, items or load sources. In the terminal, you should see some log messages regarding recording.

To replay your recording, run this command:

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

test(`Replay recorded actions`, (done) => {
  replayRequests([yourAddon], "test-session.record.js").then(done).catch(done);
});
```

Now run the tests:

```shell
npm test
```

## Cache

Caching can have many benefits for server processes. With the `ctx.cache` function you have access to a `CacheHandler` instance. Please see the function documentation for more infos about this.

By default, all cache keys get's prefixed with the addon ID. You can change this by changing the `prefix` option.

_When running in a real-world environment with more than one process and maybe more than one server, the "remote tasks" functions (`ctx.fetch` and `ctx.recaptcha`) need a cache to be enabled which is reachable from all processes._

Currently there are the following caching engines available:

#### `MemoryCache`

In memory cache, this is the default.

#### `DiskCache`

A cache which uses the file system for storage. This is the most easy to setup cache and can be very helpful during development.

To enable this, set the environment variable `DISK_CACHE` to a path.

```shell
export DISK_CACHE=/data/watched-cache
npm run develop
```

#### `RedisCache`

This cache engine is using the [redis](https://www.npmjs.com/package/redis) package. To activate it, set the environment variable `REDIS_CACHE` to a redis connection URL.

```shell
export REDIS_CACHE=redis://localhost
npm run develop
```

#### `MongoCache`

This cache engine is using [mongodb](https://www.mongodb.com/) as it's backend. To activate it, set the environment variable `MONGO_CACHE` to a mongodb connection URL.

```shell
export MONGO_CACHE=mongodb://localhost/database
npm run develop
```

## Translate your addon

For some suggestions regarding translations, please see either our `@watchedcom/i18n` package found inside `packages/i18n`, or the documentation at `docs/translations.md`.

## Developing on this repo

Clone this repo and bootstrap it with `lerna`:

```shell
npx lerna bootstrap --hoist
```

TODO: Add more infos on how to start developing.
