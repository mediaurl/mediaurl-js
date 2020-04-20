const handler = `
const { createApp } = require("@watchedcom/sdk");
const exportedProps = require("../");

module.exports = createApp(Object.values(exportedProps));
`;

/**
 * Additional files should be created on now.sh build step
 */
export const templateMap = {
  "api/handler.js": handler,
  "public/.gitkeep": "",
  "now.json": JSON.stringify(
    {
      routes: [
        {
          src: ".*",
          dest: "api/handler",
        },
      ],
    },
    null,
    2
  ),
};
