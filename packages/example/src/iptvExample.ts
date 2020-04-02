import { createIptvAddon } from "@watchedcom/sdk";
import { EXAMPLE_IPTV_ITEMS } from "./exampleData";

export const iptvExampleAddon = createIptvAddon({
  id: "watched-iptv-worker-example",
  name: "IPTV Example Addon",
  version: "1.0.0"
});

iptvExampleAddon.registerActionHandler("directory", async (input, ctx) => {
  return {
    items: EXAMPLE_IPTV_ITEMS,
    nextCursor: null
  };
});
