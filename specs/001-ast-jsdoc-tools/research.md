# Research: AST → JSDoc Tools

## Decisions

### Decision 1: AST library
- Decision: Use `ts-morph` as the primary library for AST extraction.
- Rationale: `ts-morph` provides a higher-level API over the TypeScript compiler API, reducing
  boilerplate and improving navigation of nodes, symbols, and type information. It is widely used
  for code-mod transformations and generation tasks.
- Alternatives considered: raw TypeScript `ts` compiler API (more control; more boilerplate).

### Decision 2: Prompt templates format
- Decision: Store templates as plain Markdown files under `specs/001-ast-jsdoc-tools/prompts/`.
- Rationale: Markdown is human-editable, versionable, and easy to include examples and expected
  output. Each template will include a JSON-ish example AST input and an expected JSDoc output.

### Decision 3: Context heuristics for TOOL4
- Decision: Use filename/directory/export-surface heuristics by default, with an optional
  repository override mapping file (e.g., `docs/context.json`) supported.
- Rationale: Heuristics are low-effort and broadly accurate. Mapping files are optional overrides
  for special cases.

## Research Tasks (Phase 0)

1. Prototype a small `ts-morph` extractor for a sample file and collect the JSON shape for an
   `AST Object` output.
2. Draft prompt templates for `function` and `class` with 2 examples each.
3. Implement and test simple heuristics (filename patterns and `index.ts` detection) in unit tests.

## Output summary
- `ts-morph` selected (recommended) — include as implementation hint; modules should isolate the
  dependency so it can be swapped if needed.
- Templates: `prompts/classes.md`, `prompts/functions.md`, `prompts/types-interfaces.md`, etc.
- Heuristics: implement a small rule-set and cover with tests under `specs/.../test-fixtures`.
