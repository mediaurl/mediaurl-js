const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

module.exports = yaml.safeLoad(
  fs.readFileSync(path.join(__dirname, "schema.yaml"))
);
