#!/usr/bin/env node
try {
  require("ts-node").register({ transpileOnly: true });
} catch (e) {
  console.error(
    "ts-node is required to run this script. Please install devDependencies."
  );
  process.exit(1);
}

try {
  const scaffold = require("../mcp/validation/scaffoldModule.ts");
  const moduleName = process.argv[2];
  if (!moduleName) {
    console.error("Usage: scaffold-module <module-name>");
    process.exit(1);
  }
  const res = scaffold.scaffoldModule(process.cwd(), moduleName);
  console.log("Scaffolded module:", res.modulePath);
  for (const f of res.createdFiles) console.log("  created:", f);
  process.exit(0);
} catch (err) {
  console.error(
    "Error scaffolding module:",
    err && err.stack ? err.stack : err
  );
  process.exit(2);
}
