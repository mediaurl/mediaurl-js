import {
  createWorkerAddon,
  ItemRequest,
  SourceRequest,
  SubtitleRequest
} from "@watchedcom/sdk";
import * as _ from "lodash";
import {
  EXAMPLE_ITEMS,
  EXAMPLE_SOURCES,
  EXAMPLE_SUBTITLES
} from "./exampleData";

export const addonWorkerExample = createWorkerAddon({
  id: "watched-worker-example",
  name: "Typescript Example Addon",
  version: "1.0.0",
  itemTypes: ["movie"],
  directoryPresets: [
    {
      features: {
        search: { enabled: true },
        sort: [
          { id: "name", name: "Name" },
          { id: "year", name: "Year" }
        ]
      }
    }
  ]
});

addonWorkerExample.registerActionHandler("directory", async (input, ctx) => {
  let items = _.sortBy(EXAMPLE_ITEMS, input.sort ?? "name");
  if (input.search) {
    items = items.filter(item =>
      String(item.name)
        .toLocaleLowerCase()
        .includes(input.search.toLocaleLowerCase())
    );
  }
  return {
    items,
    nextCursor: null
  };
});

addonWorkerExample.registerActionHandler(
  "item",
  async (input: ItemRequest, ctx) => {
    const id = input.ids["watched-worker-example"];
    const item = EXAMPLE_ITEMS.find(
      item => item.ids["watched-worker-example"] === id
    );
    if (!item) throw new Error("Not found");
    return item;
  }
);

addonWorkerExample.registerActionHandler(
  "source",
  async (input: SourceRequest, ctx) => {
    const id = input.ids["watched-worker-example"];
    const sources = EXAMPLE_SOURCES[id];
    return sources ?? [];
  }
);

addonWorkerExample.registerActionHandler(
  "subtitle",
  async (input: SubtitleRequest, ctx) => {
    // ids.id is an alias for ids["watched-worker-example"] (the addon ID)
    const id = input.ids.id;
    await ctx.requestCache(id);
    const subtitles = EXAMPLE_SUBTITLES[id];
    return subtitles ?? [];
  }
);
