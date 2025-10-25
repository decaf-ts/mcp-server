import { Project, SourceFile } from 'ts-morph';
import path from 'path';

let _project: Project | null = null;

export function getProject(rootDir?: string) {
  if (_project) return _project;
  _project = new Project({
    tsConfigFilePath: rootDir ? path.join(rootDir, 'tsconfig.json') : undefined,
    skipAddingFilesFromTsConfig: true
  });
  return _project;
}

export async function analyzeFile(filePath: string) {
  const project = getProject();
  const source: SourceFile = project.addSourceFileAtPathIfExists(filePath) || project.createSourceFile(filePath, undefined, { overwrite: false });

  await project.resolveSourceFileDependencies();

  // Very small example extractor: list exported declarations
  const exported = source.getExportedDeclarations();
  const entries = Array.from(exported.entries());
  const astObjects = entries.flatMap(([name, decls]) =>
    (decls as any[]).map(d => {
      // defensive accessors
      const start = typeof d.getStartLineNumber === 'function' ? d.getStartLineNumber() : 0;
      const end = typeof d.getEndLineNumber === 'function' ? d.getEndLineNumber() : 0;
      const kind = typeof d.getKindName === 'function' ? String(d.getKindName()).toLowerCase() : 'unknown';
      const startColumn = typeof (d as any).getStartLinePos === 'function' ? (d as any).getStartLinePos() : 0;
      return {
        id: `${filePath}::${name}`,
        name,
        kind,
        location: {
          filePath,
          startLine: start,
          startColumn,
          endLine: end,
          endColumn: 0
        },
        isExported: true
      } as any;
    })
  );

  return { astObjects };
}
