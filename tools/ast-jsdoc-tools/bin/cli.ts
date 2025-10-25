#!/usr/bin/env node
import minimist from 'minimist';
import path from 'path';
import { analyzeFile } from '../src/astAnalysis.js';

async function main() {
  const argv = minimist(process.argv.slice(2));
  const file = argv.file || argv.f || argv._[0];
  if (!file) {
    console.error('Usage: node cli.js --file <path-to-ts-file>');
    process.exit(2);
  }

  const abs = path.resolve(process.cwd(), String(file));
  try {
    const report = await analyzeFile(abs);
    console.log(JSON.stringify(report, null, 2));
  } catch (err: any) {
    console.error('Error analyzing file:', err.message || err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
