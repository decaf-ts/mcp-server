import { generateForObject } from '../../src/tools/ast-jsdoc-tools/tools/jsdoc-generator';

describe('JSDoc generator extended kinds', () => {
  it('generates class docs including constructor params', () => {
    const obj: any = {
      id: 'file::Greeter',
      name: 'Greeter',
      kind: 'class',
      signature: 'class Greeter { constructor(name: string, age: number) {} greet() {} }'
    };
    const s = generateForObject(obj as any);
    expect(s.suggestedDoc).toContain('Class: Greeter');
    expect(s.suggestedDoc).toContain('@param name');
    expect(s.suggestedDoc).toContain('@param age');
  });

  it('generates type/interface docs listing properties', () => {
    const obj: any = {
      id: 'file::Point',
      name: 'Point',
      kind: 'type',
      signature: 'type Point = { x: number; y: number; label?: string }'
    };
    const s = generateForObject(obj as any);
    expect(s.suggestedDoc).toContain('Type: Point');
    expect(s.suggestedDoc).toContain('@property x');
    expect(s.suggestedDoc).toContain('@property y');
    expect(s.suggestedDoc).toContain('@property label');
  });

  it('generates enum docs listing members', () => {
    const obj: any = {
      id: 'file::Flags',
      name: 'Flags',
      kind: 'enum',
      signature: 'enum Flags { A = 1, B = 2, C = 4 }'
    };
    const s = generateForObject(obj as any);
    expect(s.suggestedDoc).toContain('Enum: Flags');
    expect(s.suggestedDoc).toContain('@enum A');
    expect(s.suggestedDoc).toContain('@enum B');
    expect(s.suggestedDoc).toContain('@enum C');
  });

  it('handles constants', () => {
    const obj: any = { id: 'file::VERSION', name: 'VERSION', kind: 'constant', signature: 'const VERSION = "1.2.3"' };
    const s = generateForObject(obj as any);
    expect(s.suggestedDoc).toContain('constant: VERSION');
  });
});
