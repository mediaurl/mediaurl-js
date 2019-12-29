import {
  createWorkerAddon,
  serveAddons,
  ApiItemRequest,
  ApiSourceRequest,
  Item,
  Source
} from "../../../";

const EXAMPLE_ITEMS: Item[] = [
  {
    type: "movie",
    ids: {
      "example-ts": "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources."
  },
  {
    type: "movie",
    ids: {
      "example-ts": "id1235"
    },
    name: "Big Buck Bunny"
  }
];

type ExampleSources = {
  [k: string]: Source[];
};

const EXAMPLE_SOURCES: ExampleSources = {
  id1235: [
    {
      type: "url",
      id: "",
      name: "Source 1",
      url:
        "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
    }
  ]
};

const addon = createWorkerAddon({
  id: "example-ts",
  name: "Typescript Example Addon",
  version: "1.0.0",
  resources: [
    {
      actions: ["directory", "item", "source"],
      itemTypes: ["movie"]
    }
  ]
})
  .registerActionHandler("directory", async (args, ctx) => {
    return {
      items: EXAMPLE_ITEMS,
      hasMore: false
    };
  })
  .registerActionHandler("item", async (args: ApiItemRequest, ctx) => {
    const id = args.ids["example-ts"];
    const item = EXAMPLE_ITEMS.find(item => item.ids["example-ts"] === id);
    if (!item) throw new Error("Not found");
    return item;
  })
  .registerActionHandler("source", async (args: ApiSourceRequest, ctx) => {
    const id = args.ids["example-ts"];
    const sources = EXAMPLE_SOURCES[id];
    return sources ?? [];
  });

serveAddons([addon]);
