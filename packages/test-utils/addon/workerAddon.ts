import {
  createWorkerAddon,
  ItemRequest,
  SourceRequest,
  SubtitleRequest,
} from "@mediaurl/sdk";
import _ from "lodash";
import { TEST_ITEMS, TEST_SOURCES, TEST_SUBTITLES } from "./testData";

export const workerAddon = createWorkerAddon({
  id: "worker-test",
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

workerAddon.registerActionHandler("directory", async (input, ctx) => {
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

workerAddon.registerActionHandler("item", async (input: ItemRequest, ctx) => {
  const id = input.ids["worker-test"];
  const item = TEST_ITEMS.map((fn) => fn(true)).find(
    (item) => item.ids["worker-test"] === id
  );
  if (!item) throw new Error("Not found");
  return item;
});

workerAddon.registerActionHandler(
  "source",
  async (input: SourceRequest, ctx) => {
    const id = input.ids["worker-test"];
    const sources = TEST_SOURCES[id];
    return sources ?? [];
  }
);

workerAddon.registerActionHandler(
  "subtitle",
  async (input: SubtitleRequest, ctx) => {
    // ids.id is an alias for ids["worker-test"] (the addon ID)
    const id = input.ids.id;
    await ctx.requestCache(id);
    const subtitles = TEST_SUBTITLES[id];
    return subtitles ?? [];
  }
);

// Test for a resolver with "resolveAgain" system
const chainResolveTestUrl =
  "https://thepaciellogroup.github.io/AT-browser-tests/video/ElephantsDream.webm";

workerAddon.addResolveHandler(
  chainResolveTestUrl,
  async (match, input, ctx) => {
    if (!input.url.includes("?chain=1")) {
      return {
        url: (input.url += "?chain=1"),
        resolveAgain: true,
      };
    }
    return input.url;
  }
);
