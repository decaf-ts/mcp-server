// Public API for the AST → JSDoc tools (delegates to internal modules)
import { extractAstObjects } from './tools/ast-extractor';
import { generateForObject } from './tools/jsdoc-generator';
import { processFile as processFileImpl } from './tools/file-processor';
import { processRepo as processRepoImpl } from './tools/repo-processor';
import type { AstObject } from './types/ast';
import type { JsDocSuggestion } from './types/jsdoc';

export async function analyzeFile(filePath: string): Promise<{ astObjects: AstObject[] }> {
  const objs = await extractAstObjects(filePath);
  return { astObjects: objs };
}

export async function generateJsDoc(astObject: AstObject, contextHints?: string[]): Promise<{ suggested: JsDocSuggestion }> {
  const sug = generateForObject({ ...astObject, contextHints: contextHints || astObject.contextHints || [] } as any);
  return { suggested: sug } as any;
}

export async function processFile(filePath: string, opts: { dryRun?: boolean; repoRoot?: string } = {}) {
  return processFileImpl(filePath, opts);
}

export async function processRepo(opts: { repoRoot: string; sourcePath?: string; dryRun?: boolean }) {
  return processRepoImpl(opts);
}

export default {
  analyzeFile,
  generateJsDoc,
  processFile,
  processRepo,
};
