import path from 'path';
import fg from 'fast-glob';
import type { RepoReport } from '../types/reports';
import { processFile } from './file-processor';

export async function processRepo(opts: { repoRoot: string; sourcePath?: string; dryRun?: boolean }) {
  const root = path.resolve(opts.repoRoot);
  const src = opts.sourcePath ? path.join(root, opts.sourcePath) : root;
  const patterns = [`${src.replace(/\\/g, '/')}/**/*.ts`, `!${src.replace(/\\/g, '/')}/**/*.d.ts`];
  const files = await fg(patterns, { dot: false });
  const fileReports = [] as any[];
  for (const f of files) {
    try {
      const r = await processFile(f, { dryRun: opts.dryRun, repoRoot: root });
      fileReports.push(r);
    } catch (e) {
      fileReports.push({ filePath: f, error: String(e) });
    }
  }

  const stats = { filesProcessed: fileReports.length, totalObjects: fileReports.reduce((s, r) => s + (r?.stats?.totalObjects || 0), 0), totalSuggestions: fileReports.reduce((s, r) => s + (r?.stats?.suggestionsCreated || 0), 0), errors: fileReports.reduce((s, r) => s + (r?.stats?.errors || 0), 0) };

  const report: RepoReport = {
    repoRoot: root,
    timestamp: new Date().toISOString(),
    fileReports,
    stats
  };
  return report;
}
