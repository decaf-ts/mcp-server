import fs from 'fs';
import readline from 'readline';
import { extractAstObjects } from '../tools/ast-extractor';
import { generateForObject } from '../tools/jsdoc-generator';
import { hasExistingJsDoc } from '../utils/conflict-detector';
import path from 'path';

export async function interactiveFile(filePath: string) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`file not found: ${abs}`);
  const source = fs.readFileSync(abs, 'utf8');

  const ast = await extractAstObjects(abs);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (q: string) => new Promise<string>((res) => rl.question(q, (a) => res(a)));

  let applied = 0;
  for (const obj of ast) {
    const startLine = obj.location?.startLine || 1;
    const existing = hasExistingJsDoc(source, startLine);
    const sug = generateForObject(obj as any, existing.has ? existing.block : undefined);
    console.log('\n--- Suggestion for', obj.name, `(${obj.kind}) at line ${startLine}`);
    console.log(sug.suggestedDoc);
    if (existing.has) {
      console.log('Existing JSDoc detected; skipping by default.');
      continue;
    }
    const ans = (await ask('Apply this suggestion? (y/N) ')).trim().toLowerCase();
    if (ans === 'y' || ans === 'yes') {
      // apply: insert suggestedDoc above startLine
      const lines = source.split(/\r?\n/);
      const insertAt = Math.max(0, startLine - 1);
      lines.splice(insertAt, 0, sug.suggestedDoc);
      fs.writeFileSync(abs + '.bak', source, 'utf8');
      fs.writeFileSync(abs, lines.join('\n'), 'utf8');
      applied++;
      console.log('Applied. Backup saved to', abs + '.bak');
    } else {
      console.log('Skipped.');
    }
  }

  rl.close();
  return { filePath: abs, applied };
}

export default interactiveFile;
