import type { AstObject } from './ast';
import type { JsDocSuggestion } from './jsdoc';

export interface FileSuggestionResult {
  suggestion: JsDocSuggestion | null;
  status: 'created' | 'updated' | 'unchanged' | 'failed' | 'skipped';
  error?: string;
}

export interface FileReport {
  filePath: string;
  timestamp: string;
  astObjects: AstObject[];
  suggestions: { [id: string]: FileSuggestionResult };
  stats: {
    totalObjects: number;
    withExistingDocs: number;
    suggestionsCreated: number;
    suggestionsUpdated: number;
    errors: number;
  };
}

export interface RepoReport {
  repoRoot: string;
  timestamp: string;
  fileReports: FileReport[];
  stats: {
    filesProcessed: number;
    totalObjects: number;
    totalSuggestions: number;
    errors: number;
  };
  contextRules?: { [pattern: string]: string[] };
}
