import path from 'path';
import { analyzeFile } from '../../tools/ast-jsdoc-tools/src/astAnalysis';

describe('AST analysis (TOOL1 prototype)', () => {
  it('extracts exported objects from a simple fixture', async () => {
    const fixture = path.resolve(__dirname, '../../specs/001-ast-jsdoc-tools/test-fixtures/simple.ts');
    const report = await analyzeFile(fixture);

    expect(report).toBeDefined();
    expect(report.filePath).toContain('simple.ts');
    const names = report.objects.map((o) => o.name);

    // Expect at least the exported function, const and class names to be present
    expect(names).toEqual(expect.arrayContaining(['add', 'VERSION', 'Greeter']));
  }, 10000);
});
