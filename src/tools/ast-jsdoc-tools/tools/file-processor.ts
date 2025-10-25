import fs from 'fs';
import path from 'path';
import { extractAstObjects } from './ast-extractor';
import { inferContextHints } from '../utils/heuristics';
import { hasExistingJsDoc } from '../utils/conflict-detector';
import { generateForObject } from './jsdoc-generator';
import type { FileReport } from '../types/reports';

export async function processFile(filePath: string, opts: { dryRun?: boolean; repoRoot?: string } = {}) {
  const abs = path.resolve(filePath);
  const source = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  const ast = await extractAstObjects(abs);
  const hints = inferContextHints(abs, opts.repoRoot);

  const suggestions: Record<string, any> = {};
  let created = 0;
  const updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const obj of ast) {
    // attach inferred hints
    obj.contextHints = [...(obj.contextHints || []), ...hints];
    const startLine = obj.location?.startLine || 1;
    const existing = hasExistingJsDoc(source, startLine);
    const sug = generateForObject(obj, existing.has ? existing.block : undefined);

    let status: 'created' | 'updated' | 'unchanged' | 'failed' | 'skipped' = 'created';
    if (existing.has) {
      // conservative: skip overwrite unless apply mode
      status = 'unchanged';
      unchanged++;
    } else {
      if (!opts.dryRun) {
        try {
          // naive insertion: insert suggestedDoc above start line
          const lines = source.split(/\r?\n/);
          const insertAt = Math.max(0, startLine - 1);
          lines.splice(insertAt, 0, sug.suggestedDoc);
          fs.writeFileSync(abs + '.bak', source, 'utf8');
          fs.writeFileSync(abs, lines.join('\n'), 'utf8');
          status = 'created';
          created++;
        } catch {
          status = 'failed';
          errors++;
        }
      } else {
        created++;
        status = 'created';
      }
    }

    suggestions[obj.id] = { suggestion: sug, status };
  }

  const report: FileReport = {
    filePath: abs,
    timestamp: new Date().toISOString(),
    astObjects: ast,
    suggestions,
    stats: {
      totalObjects: ast.length,
      withExistingDocs: unchanged,
      suggestionsCreated: created,
      suggestionsUpdated: updated,
      errors
    }
  };

  return report;
}
