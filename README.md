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

### Testing with the `testAddon` function

This function will try to figure out some actions your addon provides and is doing some tests. It's an easy and quick way, especially for addons which provide a `directory` action.

Our addon creation wizard can create such a test automatically for you. Run this test with:

```shell
npm run test
```

### Record and replay requests

This might be the best choice to create a new addon. Start your developemnt server in the following way:

```shell
npm run develop -- --record somefilename.record
```

Now browse around your addon in the WATCHED app. All requests made to the addon will be written to `somefilename.record`.

The next step is to create a test case, for example `src/record.test.ts`:

```javascript
import { replayRecording } from "@watchedcom/test/src/replayRecording";
import { yourAddon } from "./index";

test(`Replay recorded actions`, done => {
  replayRecording([yourAddon], "somefilename.record")
    .then(done)
    .catch(done);
});
```

Now run the tests, preferred in `watch` mode:

```shell
npm run test -- --watch
```

## Translate your addon

For some suggestions regarind translations, please see `docs/translations.md`.

## Deploy your addon

To make your addon open to the public, you need to run it somewhere on the internet. We are working on giving an as easy as possible tutorial for a wide range of affordable or free hosting providers.

## Developing on this repo

Clone this repo and bootstrap it with `lerna`:

```shell
npx lerna bootstrap --hoist
```

TODO: Add more infos on how to start developing.
