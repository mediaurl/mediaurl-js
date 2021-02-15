#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const schema = require("./src/schema");

const json = JSON.stringify(schema, null, 2);
fs.writeFileSync(path.join(__dirname, "dist", "schema.json"), json);
fs.writeFileSync(
  path.join(__dirname, "dist", "schema.js"),
  `module.exports = ${json};`
);
