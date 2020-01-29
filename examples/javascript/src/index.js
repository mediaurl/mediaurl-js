const watched = require("../../../");

const EXAMPLE_ITEMS = [
  {
    type: "movie",
    ids: {
      "example-js": "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources."
  },
  {
    type: "movie",
    ids: {
      "example-js": "id1235"
    },
    name: "Big Buck Bunny"
  }
];

const EXAMPLE_SOURCES = {
  id1235: [
    {
      name: "Source 1",
      url:
        "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
    }
  ]
};

const addon = watched
  .createWorkerAddon({
    id: "example-js",
    name: "Javascript Example Addon",
    version: "1.0.0",
    itemTypes: ["movie"]
  })
  .registerActionHandler("directory", async (args, ctx) => {
    return {
      items: EXAMPLE_ITEMS,
      hasMore: false
    };
  })
  .registerActionHandler("item", async function(args, ctx) {
    const id = args.ids["example-js"];
    const item = EXAMPLE_ITEMS.find(item => item.ids["example-js"] === id);
    return item ? item : null;
  })
  .registerActionHandler("source", async (args, ctx) => {
    const id = args.ids["example-js"];
    const item = EXAMPLE_SOURCES[id];
    return item ? item : null;
  });

module.exports = addon;
