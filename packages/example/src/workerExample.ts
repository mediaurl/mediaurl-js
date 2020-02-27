import {
  createWorkerAddon,
  ItemRequest,
  PlayableItem,
  Source,
  SourceRequest,
  Subtitle,
  SubtitleRequest
} from "@watchedcom/sdk";

// Export needed for tests
export const EXAMPLE_ITEMS: PlayableItem[] = [
  {
    type: "movie",
    ids: {
      "watched-worker-example": "id1234"
    },
    name: "Example Item 1",
    description: "This item does not have any sources."
  },
  {
    type: "movie",
    ids: {
      "watched-worker-example": "id1235"
    },
    name: "Big Buck Bunny"
  },
  {
    type: "movie",
    ids: {
      "watched-worker-example": "elephant"
    },
    name: "Elephants Dream",
    description: "Dream of elephants?"
  }
];

type ExampleSources = {
  [k: string]: Source[];
};

// Export needed for tests
export const EXAMPLE_SOURCES: ExampleSources = {
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

// Export needed for tests
export const EXAMPLE_SUBTITLES: ExampleSubtitle = {
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

export const addonWorkerExample = createWorkerAddon({
  id: "watched-worker-example",
  name: "Typescript Example Addon",
  version: "1.0.0",
  itemTypes: ["movie"]
});

addonWorkerExample.registerActionHandler("directory", async (args, ctx) => {
  return {
    items: EXAMPLE_ITEMS,
    hasMore: false
  };
});

addonWorkerExample.registerActionHandler(
  "item",
  async (args: ItemRequest, ctx) => {
    const id = args.ids["watched-worker-example"];
    const item = EXAMPLE_ITEMS.find(
      item => item.ids["watched-worker-example"] === id
    );
    if (!item) throw new Error("Not found");
    return item;
  }
);

addonWorkerExample.registerActionHandler(
  "source",
  async (args: SourceRequest, ctx) => {
    const id = args.ids["watched-worker-example"];
    const sources = EXAMPLE_SOURCES[id];
    return sources ?? [];
  }
);

addonWorkerExample.registerActionHandler(
  "subtitle",
  async (args: SubtitleRequest, ctx) => {
    // ids.id is an alias for ids["watched-worker-example"] (the addon ID)
    const id = args.ids.id;
    await ctx.requestCache(id);
    const subtitles = EXAMPLE_SUBTITLES[id];
    return subtitles ?? [];
  }
);
