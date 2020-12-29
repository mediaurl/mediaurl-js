import { IptvItem, PlayableItem, Source, Subtitle } from "@mediaurl/sdk";

const itemTest1 = (fullData: boolean) =>
  <PlayableItem>{
    type: "movie",
    ids: {
      "worker-test": "id1234",
    },
    name: "Test Item 1",
    description: "This item does not have any sources.",
    year: 2011, // Test year to demonstrate the sort feature
  };

const itemBigBuckBunny = (fullData: boolean) =>
  <PlayableItem>{
    type: "movie",
    ids: {
      "worker-test": "id1235",
    },
    name: "Big Buck Bunny",
    year: 2013,
    ...(fullData
      ? {
          similarItems: [
            {
              id: "test",
              name: "Big Buck Bunny static similar items",
              items: [itemTest1(false), itemElephant(false)],
            },
          ],
        }
      : undefined),
  };

const itemElephant = (fullData: boolean) =>
  <PlayableItem>{
    type: "movie",
    ids: {
      "worker-test": "elephant",
    },
    name: "Elephants Dream",
    description: "Dream of elephants?",
    year: 2012,
    ...(fullData
      ? {
          similarItems: [
            {
              id: "test",
              name: "Elephants Dream static similar items",
              items: [itemTest1(false), itemBigBuckBunny(false)],
            },
          ],
        }
      : undefined),
  };

const item4k = (fullData: boolean) =>
  <PlayableItem>{
    type: "movie",
    ids: {
      "worker-test": "4ktest",
    },
    name: "4k Test",
    description: "Test video with 4k resolution",
    year: 2012,
    ...(fullData
      ? {
          similarItems: [
            {
              id: "test",
              name: "Dynamic similar items",
              args: {},
            },
            {
              id: "test-2",
              name: "Static similar items",
              items: [itemTest1(false), itemBigBuckBunny(false)],
            },
          ],
        }
      : undefined),
  };

export const TEST_ITEMS: ((fullData: boolean) => PlayableItem)[] = [
  itemTest1,
  itemBigBuckBunny,
  itemElephant,
  item4k,
];

type TestSources = {
  [k: string]: Source[];
};

// Export needed for tests
export const TEST_SOURCES: TestSources = {
  id1235: [
    {
      type: "url",
      id: "",
      name: "Source 1",
      url:
        "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4",
    },
  ],
  elephant: [
    {
      type: "url",
      name: "mp4",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.mp4",
    },
    {
      type: "url",
      name: "webm",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm",
    },
  ],
  "4ktest": [
    {
      type: "url",
      name: "hls",
      url:
        "https://bitmovin-a.akamaihd.net/content/playhouse-vr/m3u8s/105560.m3u8",
    },
  ],
};

type TestSubtitle = {
  [k: string]: Subtitle[];
};

// Export needed for tests
export const TEST_SUBTITLES: TestSubtitle = {
  elephant: [
    {
      id: "vtt",
      name: "VTT",
      language: "en",
      type: "vtt",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.vtt",
    },
    {
      id: "ttml",
      name: "TTML",
      language: "en",
      type: "ttml",
      url:
        "https://thepaciellogroup.github.io/AT-browser-tests/video/subtitles-en.ttml",
    },
  ],
};

export const TEST_IPTV_ITEMS: IptvItem[] = [
  {
    type: "iptv",
    ids: {},
    name: "Not really a livestream",
    group: "Test!",
    url:
      "https://bitmovin-a.akamaihd.net/content/playhouse-vr/m3u8s/105560.m3u8",
  },
];
