# MediaURL SDK and tools

This monorepo includes all javascript modules needed to create _MediaURL_ addons.

## Getting started

In best way to create your own MediaURL addon is by cloning our example addon and modify it.

### Prerequisites

- [nodejs](https://nodejs.org/) installed on your computer
- A text editor of your choice. Preferred are [vscode](https://code.visualstudio.com/), [atom](https://atom.io/) or [Sublime Text](https://www.sublimetext.com/)
- Basic knowledge in Javascript or Typescript

### Cloning the example addon

The best way to start is to clone our [example addon](https://github.com/mediaurl/mediaurl-example) addon:

```shell
git clone https://github.com/mediaurl/mediaurl-example.git my-addon
```

Now open the created folder `my-addon` with your editor.

### Running the addon

Without any modifications, let's start the addon and see what will happen.

**1. Start the addon server**

Open a terminal, change to the `my-addon` folder and run:

```shell
npm run develop
```

You should see something like this:

```
> mediaurl-example@0.0.0 develop /home/myname/mediaurl-example
> ts-node-dev src

[INFO] 22:50:11 ts-node-dev ver. 1.1.1 (using ts-node ver. 9.1.1, typescript ver. 4.1.3)
Hint: Start the addon with `-h` to see all available command line options
Using cache: MemoryCache
Mounting addon example
Listening on 3000
```

**2. Start the app**

MediaURL addons are currently compatible with different client apps like [WATCHED](https://www.watched.com/). It's most easy to start the desktop app on your computer.

**3. Enable developer mode**

In order to install addons in your app, you may first need to _unlock_ it:

1. Open the app, go to the **Settings** screen and make sure the **Developer mode** is enabled.
2. Go to the addon manager and deactivate the bundle addon if there is one active. If you like you also can disable all other activated addons.

**4. Add your addon**

1. Navigate to the **Add Addon** screen, where you can enter an URL.
2. If you are running the app on the same computer as the addon is running, just type `localhost`.
   
   If you are on another device, you need to find the IP address of your computer (for example `192.168.1.123`), and enter it on the input box.

   _Note: On local IP addresses, the port `3000` as well as some other default ports are omitted, so it's enough to only enter your IP._

Go to the start screen and you should see a your addon in action.

### Modify your addon

Open the `src/index.ts` file in your editor and start playing around. The server will restart automatically once you saved a file.

To reload screens in the app, swipe down until a refresh symbol appears. On the desktop app, press the refresh button on the top right corner. After the refresh, your changes should appear.

When you change the metadata of your addon (like adding a new `item` or `source` handler, or adding new item types to your addon), you need to refresh the addon. To do this, go to the _addon manager_, click on the `(I)` symbol on the right side of your addon. Once you see the addon details, swipe down to refreh.

### Documentation

Much of our documentation is in our code. Depending on your editor you should see most of the documentation while writing or when hovering a variable or function.

Please also check out our object schema here: https://www.mediaurl.io/swagger

### Publish and rename

- Before renaming the ID of your addon, you should deactivate and delete it from the app.

- Edit the name and addon ID in `package.json` and `src/index.ts`.

- Delete all unnecessary action handlers.

## Deploy your addon

Please check our deployment documentation at [docs/deployment.md](https://github.com/mediaurl/mediaurl-js/blob/master/docs/deployment.md).

## Tips for development and testing

We created some tools to make the development of addons more easy.

### Record and replay requests

Start your development server in the following way:

```shell
npm run develop -- --record test-session
```

This will create a file named `test-session.record.js` in the current directory. Now load your addon in the app and open directories, items or load sources. In the terminal, you should see some log messages regarding recording.

To replay your recording, run this command:

```shell
npm run develop -- replay test-session
```

### Create a test case with a recorded session

Create a test case file, for example `src/record.test.ts`:

```javascript
import { replayRecordFile } from "@mediaurl/sdk";
import { yourAddon } from "./index";

test(`Replay recorded actions`, (done) => {
  replayRecordFile([yourAddon], "test-session.record.js")
    .then(done)
    .catch(done);
});
```

Now run the tests:

```shell
npm test
```

## Cache

Often it is useful to cache responses or even single requests to external resources to reduce load and response speed.

The SDK integrates a very flexible caching solution. Please see [docs/caching.md](docs/caching.md) for more infos.

## Translate your addon

For some suggestions regarding translations, please see either our `@mediaurl/i18n` package found inside [packages/i18n](packages/i18n), or the documentation at [docs/translations.md](docs/translations.md).

## Developing on this repo

Clone this repo and bootstrap it with `lerna`:

```shell
npx lerna bootstrap --hoist
```
