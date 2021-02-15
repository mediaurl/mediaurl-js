import {
  createAddon,
  ItemRequest,
  SourceRequest,
  SubtitleRequest,
} from "@mediaurl/sdk";
import _ from "lodash";
import {
  TEST_IPTV_ITEMS,
  TEST_ITEMS,
  TEST_SOURCES,
  TEST_SUBTITLES,
} from "./testData";

export const dummyAddon = createAddon({
  id: "dummy-test",
  name: "Typescript Test Addon",
  version: "1.0.0",
  itemTypes: ["movie"],
  rootDirectories: [
    {
      features: {
        search: { enabled: true },
        sort: [
          { id: "name", name: "Name" },
          { id: "year", name: "Year" },
        ],
      },
    },
  ],
  dashboards: [
    {}, // Root directory
    {
      id: "by-year",
      name: "By year",
      args: { sort: "year" },
    },
  ],
});

dummyAddon.registerActionHandler("directory", async (input, ctx) => {
  let items = _.sortBy(
    TEST_ITEMS.map((fn) => fn(false)),
    input.sort ?? "name"
  );
  if (input.search) {
    items = items.filter((item) =>
      String(item.name)
        .toLocaleLowerCase()
        .includes(input.search.toLocaleLowerCase())
    );
  }
  return {
    items,
    nextCursor: null,
  };
});

dummyAddon.registerActionHandler("item", async (input: ItemRequest, ctx) => {
  const id = input.ids["dummy-test"];
  const item = TEST_ITEMS.map((fn) => fn(true)).find(
    (item) => item.ids["dummy-test"] === id
  );
  if (!item) throw new Error("Not found");
  return item;
});

dummyAddon.registerActionHandler(
  "source",
  async (input: SourceRequest, ctx) => {
    const id = input.ids["dummy-test"];
    const sources = TEST_SOURCES[id];
    return sources ?? [];
  }
);

dummyAddon.registerActionHandler(
  "subtitle",
  async (input: SubtitleRequest, ctx) => {
    // ids.id is an alias for ids["dummy-test"] (the addon ID)
    const id = input.ids.id;
    await ctx.requestCache(id);
    const subtitles = TEST_SUBTITLES[id];
    return subtitles ?? [];
  }
);

// Test for a resolver with "resolveAgain" system
const chainResolveTestUrl =
  "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm";

dummyAddon.addResolveHandler(chainResolveTestUrl, async (match, input, ctx) => {
  if (!input.url.includes("?chain=1")) {
    return {
      url: (input.url += "?chain=1"),
      resolveAgain: true,
    };
  }
  return input.url;
});

dummyAddon.registerActionHandler("iptv", async (input, ctx) => {
  return { items: TEST_IPTV_ITEMS };
});
