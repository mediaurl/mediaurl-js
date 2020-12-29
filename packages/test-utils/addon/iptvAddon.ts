import { createIptvAddon } from "@mediaurl/sdk";
import { TEST_IPTV_ITEMS } from "./testData";

export const iptvAddon = createIptvAddon({
  id: "iptv-worker-test",
  name: "IPTV Test Addon",
  version: "1.0.0",
});

iptvAddon.registerActionHandler("iptv", async (input, ctx) => {
  return { items: TEST_IPTV_ITEMS };
});
