# Quickstart: MCP Module Structure Enforcement

## 1. Prepare Environment
1. Ensure Node.js ≥22 and npm ≥10.
2. Install dependencies with `npm run do-install` (loads tokens automatically when needed).
3. Run `npm run lint` once to confirm the current branch is clean before modifying scaffolding.

## 2. Standardize Module Layout
1. For each directory under `src/modules/<name>`:
   - Create `prompts`, `resources`, `templates`, and `tools` subfolders with `index.ts` files that export typed arrays.
   - Add an `index.ts` at the module root to re-export the four lists plus module metadata.
2. Add placeholder entries if a list would otherwise be empty; validators treat a module with empty exports as disabled unless flagged explicitly.

## 3. Implement Validation Utility
1. Build `ModuleScaffoldingValidator` (e.g., `src/utils/moduleValidator.ts`) that:
   - Walks module directories via Node FS.
   - Confirms each required folder exists.
   - Imports each module’s index to verify exports match shared interfaces.
   - Emits structured `ValidationIssue`s for missing folders, exports, or duplicate IDs.
2. Wire the validator into `npm run lint` (pre-lint hook) and the Jest setup file so unit tests fail fast on structural drift.

## 4. Aggregate Assets in MCP Server
1. Add a `ModuleRegistry` that loads every module export and decorates entries with provenance metadata.
2. Update `src/mcp` lists (prompts/resources/templates/tools) to import from the registry instead of hand-curated arrays.
3. Ensure duplicate IDs throw descriptive errors and disabled modules are skipped.

## 5. Update Documentation & Tooling
1. Refresh README/workdocs to explain how to add a new module and how validation behaves.
2. Regenerate docs if CLI surface or module onboarding instructions change: `npm run docs`.
3. Run `npm run test:dist`, `npm run build`, and `npm run build:prod` to ensure Dual-Target Distribution remains healthy.

## 6. Validation Before PR
1. Execute `npm run lint`, `npm run test:all`, `npm run coverage`, and `npm run prepare-pr`.
2. Attach validator output (or confirmation) plus updated docs to the pull request.
