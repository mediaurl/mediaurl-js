#!/usr/bin/env node
import * as commander from "commander";
import { createHandler } from "./create";
import { templateMap as nowTemplate } from "./now-sh-support";
import { executeProjectTemplate } from "./templates";

commander
  .arguments("<name>")
  .version(require("../package.json").version)
  .description("Create WATCHED addon folder")
  .option("--template <template>", "js|ts")
  .option("--force")
  .action(createHandler);

commander.command("now-sh-prepare").action(async () => {
  await executeProjectTemplate(nowTemplate, process.cwd(), {});
});

// commander.on("command:*", function() {
//   commander.outputHelp();
//   process.exit(1);
// });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
