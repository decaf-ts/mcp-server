import { inferContextHints } from '../../src/tools/ast-jsdoc-tools/utils/heuristics';
import path from 'path';

test('inferContextHints picks up cli and controller patterns', () => {
  const p = path.join('src', 'api', 'users.controller.ts');
  const hints = inferContextHints(p, '/repo/root');
  expect(hints).toContain('api');
  expect(hints).toContain('controller');
});

test('inferContextHints marks library for src files and index detection', () => {
  const p = path.join('lib', 'index.ts');
  const hints = inferContextHints(p, '/repo/root');
  expect(hints).toContain('library');
  expect(hints).toContain('index');
});
