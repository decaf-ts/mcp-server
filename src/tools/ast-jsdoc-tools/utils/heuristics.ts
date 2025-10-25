import path from 'path';

export function inferContextHints(filePath: string, repoRoot?: string): string[] {
  const rel = repoRoot ? path.relative(repoRoot, filePath) : filePath;
  const parts = rel.split(path.sep);
  const hints = new Set<string>();

  const p = rel.toLowerCase();
  if (p.includes(`${path.sep}cli${path.sep}`) || p.endsWith('.cli.ts') || p.includes('bin')) hints.add('cli');
  if (p.includes(`${path.sep}api${path.sep}`) || p.includes('/api/')) hints.add('api');
  if (p.includes(`${path.sep}lib${path.sep}`) || p.includes('/lib/')) hints.add('lib');
  if (p.includes('test') || p.includes('__tests__')) hints.add('test-fixture');
  if (p.endsWith('index.ts')) hints.add('index');

  // filename patterns
  const file = path.basename(rel);
  if (file.endsWith('.controller.ts')) hints.add('controller');
  if (file.endsWith('.service.ts')) hints.add('service');
  if (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) hints.add('test');

  // default: if under src or lib, mark as library
  if (parts.includes('src') || parts.includes('lib')) hints.add('library');

  return Array.from(hints);
}
