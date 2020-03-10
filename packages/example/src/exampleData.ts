import { PlayableItem, Source, Subtitle } from "@watchedcom/sdk";

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
