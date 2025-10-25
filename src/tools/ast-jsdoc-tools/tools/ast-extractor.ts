import type { AstObject } from '../types/ast';
import { analyzeFile as analyze } from '../utils/ts-project';

export async function extractAstObjects(filePath: string): Promise<AstObject[]> {
  const res: any = await analyze(filePath);
  if (!res || !res.astObjects) return [];
  // Normalize shape to AstObject as much as possible
  return res.astObjects.map((o: any) => ({
    id: o.id,
    name: o.name,
    kind: (o.kind as any) || 'unknown',
    location: o.location,
    isExported: !!o.isExported,
    signature: o.signature,
    parentId: o.parentId,
    children: o.children,
    decorators: o.decorators,
    contextHints: o.contextHints || []
  }));
}
