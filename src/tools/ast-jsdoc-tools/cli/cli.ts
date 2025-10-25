#!/usr/bin/env node

// Lightweight CLI entrypoint (scaffold)
// Import public API from the migrated implementation under src/tools/ast-jsdoc-tools
import { processRepo as repoProcessor } from '../tools/repo-processor';
import { processFile as fileProcessor } from '../tools/file-processor';
import { interactiveFile } from './interactive';

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  try {
    switch (cmd) {
      case 'analyze': {
        console.log('analyze command placeholder', args.slice(1));
        break;
      }
      case 'generate': {
        console.log('generate command placeholder', args.slice(1));
        break;
      }
      case 'file': {
        // usage: file <path> [--dry-run]
        const fp = args[1];
        const dry = args.includes('--dry-run');
        console.log(JSON.stringify(await fileProcessor(fp, { dryRun: dry }), null, 2));
        break;
      }
      case 'interactive': {
        // usage: interactive <path>
        const fp = args[1];
        if (!fp) {
          console.error('Usage: cli.js interactive <path>');
          break;
        }
        const res = await interactiveFile(fp, { repoRoot: process.cwd() });
        console.log('Interactive session complete:', res);
        break;
      }
      case 'repo': {
        // usage: repo <root> [--src src] [--dry-run]
        const root = args[1] || '.';
        const srcArgIndex = args.indexOf('--src');
        const src = srcArgIndex >= 0 ? args[srcArgIndex + 1] : 'src';
        const dryRepo = args.includes('--dry-run');
        console.log(JSON.stringify(await repoProcessor({ repoRoot: root, sourcePath: src, dryRun: dryRepo }), null, 2));
        break;
      }
      default:
        console.log('Usage: cli.js <analyze|generate|file|repo> [options]');
    }
  } catch (err) {
    console.error('CLI error', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
