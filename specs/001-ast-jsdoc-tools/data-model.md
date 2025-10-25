# Data Model: AST → JSDoc Tools

## Entities

- AST Object
  - id: string (filePath + symbolName)
  - name: string
  - kind: enum (Module|Class|Function|Interface|TypeAlias|Enum|Constant|Decorator|Namespace|CLI)
  - location: { file: string, start: {line, col}, end: {line, col} }
  - exportStatus: enum (default|named|private)
  - signature: string (human-readable signature when available)
  - children: list[AST Object] (for nested types)

- JSDoc Suggestion
  - astObjectId: string
  - summary: string
  - description: string (optional details)
  - tags: list[{tag: string, name?: string, description?: string}]
  - confidence: number (0-1) - heuristics score optional

- File Report
  - file: string
  - objects: list[{ astObjectId, suggestionStatus: enum(created|updated|unchanged|skipped), suggestion: JSDoc Suggestion? }]
  - errors: list[string]

- Repository Run Report
  - runId: string (timestamped)
  - filesProcessed: number
  - objectsFound: number
  - suggestionsGenerated: number
  - created: number
  - updated: number
  - unchanged: number
  - failed: number
  - perFileReports: list[File Report]

## Validation Rules

- AST Object must include name and kind. Missing names are flagged as `skipped` in reports.
- JSDoc Suggestion must include a non-empty summary.
