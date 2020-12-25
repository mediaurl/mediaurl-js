import { createIptvAddon } from "@mediaurl/sdk";
import { EXAMPLE_IPTV_ITEMS } from "./exampleData";

export const iptvExampleAddon = createIptvAddon({
  id: "iptv-worker-example",
  name: "IPTV Example Addon",
  version: "1.0.0",
});

iptvExampleAddon.registerActionHandler("iptv", async (input, ctx) => {
  return { items: EXAMPLE_IPTV_ITEMS };
});
