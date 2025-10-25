import { hasExistingJsDoc } from '../../src/tools/ast-jsdoc-tools/utils/conflict-detector';

const sample = `/**\n * Existing description\n */\nexport function add(a: number, b: number) {\n  return a + b;\n}\n`;

test('detects existing JSDoc block before node', () => {
  const res = hasExistingJsDoc(sample, 3); // function starts at line 3 (1-based)
  expect(res.has).toBe(true);
  expect(res.block).toContain('Existing description');
});

const noBlock = `export function add(a: number) { return a; }`;
test('returns false when no jsdoc present', () => {
  const res = hasExistingJsDoc(noBlock, 1);
  expect(res.has).toBe(false);
});
