# Example Typescript Addon

Very simple static WATCHED typescript addon.

## Start the server

```shell
cd examples/typescript
npm i
npx wsdk serve
# or to start the server for production
npm run build
npx wsdk serve --prod
```

## Add the addon to the WATCHED app

1. Find out the local IP address of your computer.
2. Go to the "Add Addon" screen of the app.
3. Enter the IP of your plus the addon ID. For example `192.168.1.12/example-js`.
4. Press `Continue` and you will see the addon.
