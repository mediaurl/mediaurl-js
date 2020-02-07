# WATCHED.com Javascript SDK

With the WATCHED.com nodejs SDK you easily can create your own addons.

## Getting started

1. Create a new addon with our wizard:

   ```shell
   npm @watchedcom/sdk create my-addon
   ```

   Follow the steps of the wizard. We strongly recommend to use the `typescript` template, but you also can stick to raw javascript instead.

2. Install dependencies:

   ```shell
   cd my-addon
   npm install
   ```

3. Your addon is ready. You can now edit your code, and then head over to the next step.

## Testing your addon

1. Start the development server:

   ```shell
   npm run develop
   ```

   This server will automatically restart itself when you make changes in your code.

2. Open the WATCHED app on your mobile and go to the `Add Addon` screen, where you can enter a URL.

3. Enter the IP address of your computer. For example `192.168.1.123`, or with port number `192.168.1.123:1234`. On local IP addresses, the port `3000` as well as some other default ports are omitted.

## Deploy your addon

To make your addon open to the public, you need to run it somewhere on the internet. We are working on giving an as easy as possible tutorial for a wide range of affordable or free hosting providers.
