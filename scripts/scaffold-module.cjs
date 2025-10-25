#!/usr/bin/env node
// @ts-nocheck
const path = require("path");
const fs = require("fs");

try {
  const [, , moduleName] = process.argv;
  if (!moduleName) {
    console.error("Usage: scaffold-module <module-name>");
    process.exit(1);
  }
  const scaffold = require("../src/mcp/validation/scaffoldModule.ts");
  const res = scaffold.scaffoldModule(process.cwd(), moduleName);
  console.log("Scaffolded module:", res.modulePath);
  for (const f of res.createdFiles) console.log("  created:", f);
  process.exit(0);
} catch (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(2);
}
