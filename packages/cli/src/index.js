#!/usr/bin/env node

/**
 * Use ts-node to execute sources without compilation
 * Only for development purposes
 */

const path = require("path");
const { fork } = require("child_process");

const cwd = process.cwd();

const mainScript = path.resolve(__dirname, "index.ts");
const execPath = path.resolve(cwd, "node_modules", ".bin", "ts-node");

// Use tsconfig.json from sdk-javascript
const execArgs = ["--dir", path.resolve(__dirname, "..")];

fork(mainScript, process.argv.splice(2), { execPath, execArgs });
