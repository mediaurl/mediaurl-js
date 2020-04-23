/**
 * now.sh -> vercel.com
 */
const handler = `const { createApp } = require("@watchedcom/sdk");

module.exports = createApp(Object.values(require("./")));
`;

export const templateMap = {
  ".now.js": handler,
  "now.json": JSON.stringify(
    {
      builds: [
        {
          src: ".now.js",
          use: "@now/node",
        },
      ],
      routes: [
        {
          src: ".*",
          dest: ".now.js",
        },
      ],
    },
    null,
    2
  ),
};
