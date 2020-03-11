import {
  createWorkerAddon,
  ItemRequest,
  SourceRequest,
  SubtitleRequest
} from "@watchedcom/sdk";
import {
  EXAMPLE_ITEMS,
  EXAMPLE_SOURCES,
  EXAMPLE_SUBTITLES
} from "./exampleData";

export const addonWorkerExample = createWorkerAddon({
  id: "watched-worker-example",
  name: "Typescript Example Addon",
  version: "1.0.0",
  itemTypes: ["movie"]
});

addonWorkerExample.registerActionHandler("directory", async (input, ctx) => {
  return {
    items: EXAMPLE_ITEMS,
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
