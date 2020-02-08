#!/usr/bin/env node
import * as commander from "commander";
import { createHandler } from "./create";

commander
  .arguments("<name>")
  .version(require("../package.json").version)
  .description("Create WATCHED addon folder")
  .option("--template <template>", "js|ts")
  .option("--force")
  .action(createHandler);

// commander.on("command:*", function() {
//   commander.outputHelp();
//   process.exit(1);
// });

commander.parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
