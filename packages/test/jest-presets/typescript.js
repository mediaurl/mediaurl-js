const { defaults } = require("ts-jest/presets");
const path = require("path");

module.exports = {
  ...defaults,
  testEnvironment: "node",
  setupFilesAfterEnv: [path.join(__dirname, "jest.setup.js")]
};
