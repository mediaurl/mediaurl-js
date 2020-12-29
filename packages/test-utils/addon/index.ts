export { iptvAddon } from "./iptvAddon";
export { repoAddon } from "./repoAddon";
export { workerAddon } from "./workerAddon";

import { runCli } from "@mediaurl/sdk";
import { iptvAddon } from "./iptvAddon";
import { repoAddon } from "./repoAddon";
import { workerAddon } from "./workerAddon";

runCli([workerAddon, iptvAddon, repoAddon]);
