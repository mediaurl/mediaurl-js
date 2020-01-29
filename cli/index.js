#!/usr/bin/env node
const program = require("commander");
const { startHandler } = require("./start");
const { createHandler } = require("./create");

program
  .command("start [files...]")
  .option("--prod", "Start the server in production mode")
  .description("Start the WATCHED SDK server")
  .action(startHandler);

program
  .command("create <name>")
  .description("Create WATCHED addon folder")
  .option("--template <template>", "js|ts")
  .option("--force")
  .action(createHandler);

program.on("command:*", function() {
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
