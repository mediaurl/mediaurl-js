import { runCli } from "@watchedcom/sdk";
import { iptvExampleAddon } from "./iptvExample";
import { repoExampleAddon } from "./repoExample";
import { workerExampleAddon } from "./workerExample";

runCli([workerExampleAddon, iptvExampleAddon, repoExampleAddon]);
