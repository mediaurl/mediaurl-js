# WATCHED.com Javascript Monorepo

This monorepo includes all javascript modules needed to create easily addons for WATCHED.

## Create your own addon

With the WATCHED.com nodejs SDK you easily can create your own addons.

### Getting started

1. Create a new addon with our wizard:

   ```shell
   npx @watchedcom/create my-addon
   ```

   Follow the steps of the wizard. We strongly recommend to use the `typescript` template.

2. Your addon is ready. You can now edit your code, and then head over to the next step.

### Test your addon

1. Start the development server:

   ```shell
   npm run develop
   ```

   This server will automatically restart itself when you make changes in your code.

2. Open the WATCHED app on your mobile and go to the `Add Addon` screen, where you can enter a URL.

3. Enter the IP address of your computer. For example `192.168.1.123`, or with port number `192.168.1.123:1234`. On local IP addresses, the port `3000` as well as some other default ports are omitted.

### Deploy your addon

To make your addon open to the public, you need to run it somewhere on the internet. We are working on giving an as easy as possible tutorial for a wide range of affordable or free hosting providers.

## Developing on this repo

Clone this repo and bootstrap it with `lerna`:

```shell
npx lerna bootstrap --hoist
```
