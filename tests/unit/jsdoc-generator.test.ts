import { generateForObject } from '../../src/tools/ast-jsdoc-tools/tools/jsdoc-generator';

test('generateForObject produces params and returns for function signature', () => {
  const obj: any = {
    id: 'f1',
    name: 'add',
    kind: 'function',
    signature: '(a: number, b: number): number',
    location: { filePath: 'file.ts', startLine: 1 }
  };
  const sug = generateForObject(obj);
  expect(sug).toBeDefined();
  expect(sug.suggestedDoc).toContain('@param a');
  expect(sug.suggestedDoc).toContain('@param b');
  expect(sug.suggestedDoc).toContain('@returns number');
});

test('generateForObject handles no-signature case and marks needsReview', () => {
  const obj: any = {
    id: 'f2',
    name: 'doSomething',
    kind: 'function',
    location: { filePath: 'file.ts', startLine: 1 }
  };
  const sug = generateForObject(obj);
  expect(sug.needsReview).toBe(true);
  expect(sug.suggestedDoc).toContain('TODO: Describe doSomething');
});
