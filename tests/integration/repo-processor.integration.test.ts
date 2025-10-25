import { processRepo } from '../../src/tools/ast-jsdoc-tools/tools/repo-processor';
import path from 'path';

test('processRepo dry-run on fixture repo returns report', async () => {
  const repoRoot = path.join(__dirname, '..', 'fixtures');
  const report = await processRepo({ repoRoot, sourcePath: '.', dryRun: true });
  expect(report).toBeDefined();
  expect(report.stats.filesProcessed).toBeGreaterThanOrEqual(1);
});
