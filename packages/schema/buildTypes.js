#!/usr/bin/env node
const { compile } = require("json-schema-to-typescript");
const $RefParser = require("json-schema-ref-parser");
const path = require("path");
const fs = require("fs");

const declarationsOutputPath = path.resolve(__dirname, "dist");

const generateTsDeclarations = async () => {
  const schema = await $RefParser.parse("./dist/schema.json");
  schema.type = "object";
  schema.properties = {};
  schema.additionalProperties = false;
  Object.keys(schema.definitions).forEach(key => {
    schema.properties["_" + key] = { $ref: "#/definitions/" + key };
  });

  const indexData = fs.readFileSync(
    path.resolve(declarationsOutputPath, "index.d.ts")
  );

  const output = await compile(schema, "__ROOT_TYPE__");
  fs.writeFileSync(
    path.resolve(declarationsOutputPath, "index.d.ts"),
    `export * from './helpers.d';

${indexData}

${output}`
  );
};

generateTsDeclarations();
