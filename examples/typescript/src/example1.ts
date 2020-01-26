import {
  createWorkerAddon,
  ApiItemRequest,
  ApiSourceRequest,
  ApiSubtitleRequest,
  Item,
  Source,
  Subtitle
} from "../../../dist";

const EXAMPLE_ITEMS: Item[] = [
  {
    type: "movie",
    ids: {
      example1: "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources."
  },
  {
    type: "movie",
    ids: {
      example1: "id1235"
    },
    name: "Big Buck Bunny"
  },
  {
    type: "movie",
    ids: {
      example1: "elephant"
    },
    name: "Elephants Dream",
    description: "Dream of elephants?"
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
  ],
  elephant: [
    {
      type: "url",
      name: "mp4",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.mp4"
    },
    {
      type: "url",
      name: "webm",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm"
    }
  ]
};

type ExampleSubtitle = {
  [k: string]: Subtitle[];
};

const EXAMPLE_SUBTITLES: ExampleSubtitle = {
  elephant: [
    {
      id: "vtt",
      name: "VTT",
      language: "en",
      type: "vtt",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.vtt"
    },
    {
      id: "ttml",
      name: "TTML",
      language: "en",
      type: "ttml",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.ttml"
    }
  ]
};

const addon = createWorkerAddon({
  id: "example1",
  name: "Typescript Example Addon",
  version: "1.0.0",
  actions: ["directory", "item", "source", "subtitle"],
  itemTypes: ["movie"]
})
  .registerActionHandler("directory", async (args, ctx) => {
    return {
      items: EXAMPLE_ITEMS,
      hasMore: false
    };
  })
  .registerActionHandler("item", async (args: ApiItemRequest, ctx) => {
    const id = args.ids["example1"];
    const item = EXAMPLE_ITEMS.find(item => item.ids["example1"] === id);
    if (!item) throw new Error("Not found");
    return item;
  })
  .registerActionHandler("source", async (args: ApiSourceRequest, ctx) => {
    const id = args.ids["example1"];
    const sources = EXAMPLE_SOURCES[id];
    return sources ?? [];
  })
  .registerActionHandler("subtitle", async (args: ApiSubtitleRequest, ctx) => {
    // ids.id is an alias for ids["addon-id"]
    const id = args.ids.id;
    const subtitles = EXAMPLE_SUBTITLES[id];
    return subtitles ?? [];
  });

export default addon;
