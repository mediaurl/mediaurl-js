# Addon development and testing

A good addon development environment can be one of the followings.

The first thing is to start the addon server in dev mode:

```shell
npm run develop
```

## Test with the WATCHED app

1. Open the WATCHED app on your mobile and go to the `Add Addon` screen, where you can enter a URL.
2. Enter the IP address of your computer. For example `192.168.1.123`, or with port number `192.168.1.123:1234`. On local IP addresses, the port `3000` as well as some other default ports are omitted.

## Testing with the `testAddon` function

This function will try to figure out some actions for addon provides and is doing some tests. It's an easy and quick way, especially for addons which provide a `directory` action.

Our addon creation wizard will create such a test automatically for you.

## Record and replay requests

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
