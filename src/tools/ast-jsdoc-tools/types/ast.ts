export type AstObjectKind =
  | 'class'
  | 'function'
  | 'interface'
  | 'type'
  | 'enum'
  | 'constant'
  | 'module'
  | 'namespace'
  | 'decorator'
  | 'cli-module';

export interface SourceLocation {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface AstObject {
  id: string;
  name: string;
  kind: AstObjectKind;
  location: SourceLocation;
  isExported: boolean;
  signature?: string;
  parentId?: string;
  children?: string[];
  decorators?: string[];
  contextHints?: string[];
}
