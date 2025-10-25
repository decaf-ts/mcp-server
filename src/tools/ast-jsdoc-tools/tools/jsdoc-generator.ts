import type { AstObject } from '../types/ast';

export function generateForObject(obj: AstObject, existing?: string) {
  // Very simple heuristics: for functions, generate params/returns from signature if possible
  const summary = `TODO: Describe ${obj.name}`;
  let returns = 'void';
  const params: Array<{ name: string; desc: string }> = [];

  // try to parse signature like (a: number, b: number): number
  if (obj.signature) {
    const sig = obj.signature;
    const m = sig.match(/\(([^)]*)\)\s*:\s*([^\s]+)/);
    if (m) {
      const paramsStr = m[1].trim();
      const ret = m[2].trim();
      returns = ret;
      if (paramsStr) {
        const parts: string[] = paramsStr.split(',').map((p: string) => p.trim());
        for (const p of parts) {
          const n = p.split(':')[0].trim();
          params.push({ name: n, desc: 'TODO: describe parameter' });
        }
      }
    }
  }

  // If it's a function-like object, include params/returns
  const block = ['/**', ` * ${summary}`];
  if (obj.kind === 'function') {
    for (const p of params) block.push(` * @param ${p.name} ${p.desc}`);
    block.push(` * @returns ${returns}`);
  } else if (obj.kind === 'class') {
    block.push(` * Class: ${obj.name}`);
    // try to include constructor params if present in signature
    const cm = (obj.signature || '').match(/constructor\s*\(([^)]*)\)/);
    if (cm && cm[1].trim()) {
      const parts: string[] = cm[1].split(',').map((s) => s.trim());
      for (const p of parts) {
        const n = p.split(':')[0].trim();
        block.push(` * @param ${n} TODO: describe parameter`);
      }
    }
  } else if (obj.kind === 'interface' || obj.kind === 'type') {
    block.push(` * Type: ${obj.name}`);
    // try to list first-level properties
  const propMatch = (obj.signature || '').match(/{([\s\S]*)}/);
    if (propMatch) {
      const body = propMatch[1].trim();
      const props = body.split(/[,;]\s*/).map((s) => s.trim()).filter(Boolean);
      for (const p of props) {
        const n = p.split(':')[0].replace(/\?/g, '').trim();
        if (n) block.push(` * @property ${n} TODO: describe`);
      }
    }
  } else if (obj.kind === 'enum') {
    block.push(` * Enum: ${obj.name}`);
    const sig = obj.signature || '';
    const open = sig.indexOf('{');
    const close = sig.lastIndexOf('}');
    if (open >= 0 && close > open) {
      const members = sig.slice(open + 1, close).split(',').map((s) => s.trim()).filter(Boolean);
      for (const m of members) {
        const name = m.split('=')[0].trim();
        if (name) block.push(` * @enum ${name}`);
      }
    }
  } else if (obj.kind === 'constant' || obj.kind === 'module' || obj.kind === 'namespace') {
    block.push(` * ${obj.kind}: ${obj.name}`);
  }

  block.push(' */');

  return {
    targetId: obj.id,
    summary,
    description: '',
    tags: params.map(p => ({ name: 'param', value: `${p.name} ${p.desc}` })),
    needsReview: params.length === 0 || returns === 'void',
    existingDoc: existing,
    suggestedDoc: block.join('\n')
  };
}
