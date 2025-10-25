import { analyzeFile } from '../../src/tools/ast-jsdoc-tools/utils/ts-project';
import path from 'path';

test('analyzeFile returns shape', async () => {
  const fp = path.join(__dirname, '..', 'fixtures', 'single', 'example.ts');
  // If fixture missing, ensure function doesn't throw
  await expect(analyzeFile(fp)).resolves.toBeDefined();
});
