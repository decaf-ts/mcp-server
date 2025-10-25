#!/usr/bin/env node
// Lightweight CLI wrapper to execute the TypeScript validator using ts-node
const path = require('path');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

try {
  // Register ts-node to allow requiring TS files directly
  require('ts-node').register({ transpileOnly: true });
} catch (e) {
  fail('ts-node not available. Please install devDependencies (npm install) to run this script.');
}

try {
  const validator = require('../mcp/validation/index.ts');
  const report = validator.validateModules(process.cwd());
  if (!report.ok) {
    console.error('Module validation failed:');
    console.error(JSON.stringify(report, null, 2));
    process.exit(2);
  }
  console.log('Module validation passed');
  process.exit(0);
} catch (err) {
  console.error('Error executing module validator:', err && err.stack ? err.stack : err);
  process.exit(3);
}
