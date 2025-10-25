import path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

export type AstObject = {
  name: string;
  kind: string;
  exported: boolean;
  startLine: number;
  endLine: number;
  signature?: string;
};

export type AstFileReport = {
  filePath: string;
  objects: AstObject[];
};

/**
 * Analyze a TypeScript file and return a structured list of AST objects.
 * This is a small prototype (TOOL1) intended to validate the data model used
 * by later tools. It uses ts-morph to parse the file and extract exported
 * declarations and some basic signature information.
 */
export async function analyzeFile(filePath: string): Promise<AstFileReport> {
  const project = new Project({ tsConfigFilePath: undefined });
  const abs = path.resolve(filePath);
  const sourceFile = project.addSourceFileAtPath(abs);

  const exported = sourceFile.getExportedDeclarations();
  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();

  const objects: AstObject[] = [];

  // Process exported declarations first
  for (const [name, decls] of exported.entries()) {
    for (const decl of decls) {
      const kind = SyntaxKind[decl.getKind()] || decl.getKindName?.() || 'Unknown';
      const startLine = decl.getStartLineNumber();
      const endLine = decl.getEndLineNumber();
      let signature: string | undefined;

      try {
        // Quick best-effort signature extraction
        if (decl.getKindName && /Function|Method/.test(decl.getKindName())) {
          signature = decl.getText().split('{', 1)[0].trim();
        } else if (/Class/.test(decl.getKindName?.() || '')) {
          signature = decl.getText().split('{', 1)[0].trim();
        } else if (/Interface|TypeAlias|Enum/.test(decl.getKindName?.() || '')) {
          signature = decl.getText().split('{', 1)[0].trim();
        } else {
          signature = decl.getText().slice(0, 200).replace(/\s+/g, ' ').trim();
        }
      } catch {
        signature = undefined;
      }

      objects.push({
        name,
        kind,
        exported: true,
        startLine,
        endLine,
        signature,
      });
    }
  }

  // If there is a default export and it's not already captured, add it
  if (defaultExportSymbol) {
    const defName = defaultExportSymbol.getName() || 'default';
    const declarations = defaultExportSymbol.getDeclarations();
    if (declarations.length) {
      const d = declarations[0];
      const kind = SyntaxKind[d.getKind()] || d.getKindName?.() || 'Unknown';
      objects.push({
        name: defName,
        kind,
        exported: true,
        startLine: d.getStartLineNumber(),
        endLine: d.getEndLineNumber(),
        signature: d.getText().split('{', 1)[0].trim(),
      });
    }
  }

  // Also include top-level non-exported declarations as optional information
  const topLevel = sourceFile.getStatements();
  for (const stmt of topLevel) {
    const kindName = stmt.getKindName?.() || '';
    // skip if it's already an exported declaration (we collected exported ones)
    if (/FunctionDeclaration|ClassDeclaration|InterfaceDeclaration|TypeAliasDeclaration|EnumDeclaration|VariableStatement/.test(kindName)) {
      const name = (stmt as any).getName ? (stmt as any).getName() : undefined;
      if (!name) continue; // anonymous
      const already = objects.find((o) => o.name === name);
      if (already) continue;
      objects.push({
        name,
        kind: kindName,
        exported: false,
        startLine: stmt.getStartLineNumber(),
        endLine: stmt.getEndLineNumber(),
        signature: stmt.getText().split('{', 1)[0].trim(),
      });
    }
  }

  return { filePath: abs, objects };
}

export default analyzeFile;
