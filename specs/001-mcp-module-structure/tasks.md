# Tasks for Feature: MCP Module Structure Enforcement

Feature dir: `specs/001-mcp-module-structure`

Overview: Implement structural validation and aggregation of module assets (prompts/resources/templates/tools) and expose them from the MCP server. Tasks are organized by phase and user story per speckit rules.

PHASE 1 — Setup

- [ ] T001 Create feature task list file `specs/001-mcp-module-structure/tasks.md`
- [ ] T002 Initialize project-level validation utilities at `src/mcp/validation/index.ts`
- [ ] T003 [P] Add TypeScript types for module packages at `src/mcp/types.ts`

PHASE 2 — Foundational

- [ ] T004 Add a CLI helper for module discovery at `src/mcp/cli/discover-modules.ts`
- [ ] T005 Add unit-test harness configuration for module validation at `tests/unit/validate-modules.test.ts`
- [ ] T006 [P] Add small README `specs/001-mcp-module-structure/README.md` documenting folder conventions used by tasks

PHASE 3 — User Story 1 (US1) - Standardize Module Scaffolding (Priority: P1)

Tasks implement the scaffolding and validation routine that enforces every `src/modules/*` directory contains `prompts`, `resources`, `templates`, `tools` with typed index exports.

- [ ] T007 [US1] Create validation module `src/mcp/validation/validateModules.ts` that:
    - accepts a repo root or absolute `src/modules` path
    - verifies each module folder contains the four required subfolders
    - checks each subfolder exports an index (e.g. `index.ts`/`index.js`) that exports a typed array
    - emits a structured Validation Report with missing folders, missing exports, empty lists and remediation hints

- [ ] T008 [US1] Create typed placeholders scaffold generator `src/mcp/validation/scaffoldModule.ts` that:
    - given a module name/path, creates `prompts`, `resources`, `templates`, `tools` with example `index.ts` exports and type-safe placeholder items
    - returns the created file list

- [ ] T009 [US1] Add unit tests `tests/unit/validation-scaffold.test.ts` for the scaffolder (happy path and missing-folder path)

- [ ] T010 [US1] Integrate validation into `npm run lint` and `npm run test:unit` by adding an npm script `validate-modules` in `package.json` and wiring it to run before tests (CI-friendly)

PHASE 4 — User Story 2 (US2) - Aggregate Module Assets into MCP Server (Priority: P2)

Tasks implement aggregation that concatenates module exports into master lists, detects duplicates, and provides provenance metadata.

- [ ] T011 [US2] Implement aggregator `src/mcp/aggregateModules.ts` that:
    - imports each module's exported arrays (prompts, resources, templates, tools)
    - concatenates them into master lists while attaching provenance { moduleName, modulePath }
    - detects duplicate identifiers across modules, logs deterministic errors, and prevents duplicates from being registered

- [ ] T012 [US2] Export aggregated master lists from `src/mcp/index.ts` and ensure `esm/` and `lib/` outputs will include these lists after build

- [ ] T013 [US2] Add integration test `tests/integration/mcp-aggregation.test.ts` that mounts a test MCP instance, injects two sample modules, and verifies the aggregated arrays include all items exactly once and that duplication handling is exercised

- [ ] T014 [US2] Add logging/reporting for aggregation conflicts to `src/mcp/validation/reporters.ts` and include an optional JSON output mode for CI consumers

PHASE 5 — User Story 3 (US3) - LLM Receives Enriched Context (Priority: P3)

Tasks ensure FASTMCP sessions expose the consolidated assets and provenance metadata to clients.

- [ ] T015 [US3] Wire aggregated lists into FASTMCP session initialization at `src/mcp/fastmcp-wiring.ts` (or the existing MCP server bootstrap file)

- [ ] T016 [US3] Add an endpoint or capability manifest at `src/mcp/manifest.ts` that returns aggregated lists with provenance for clients (and unit tests at `tests/unit/manifest.test.ts`)

- [ ] T017 [US3] Add an end-to-end test `tests/integration/mcp-e2e.test.ts` that simulates a FASTMCP client requesting the catalog and verifies provenance metadata is present and correct

PHASE 6 — Polish & Documentation

- [ ] T018 Update repository README `Readme.md` and workdocs `workdocs/5-HowToUse.md` with instructions on adding a new module and the validation/aggregation behavior
- [ ] T019 Add developer guide `docs/module-structure.md` outlining structure, types, and examples of placeholder exports
- [ ] T020 [P] Run full test suite and capture coverage for the new modules; update CI scripts if needed to include validation step

Dependencies & Execution Notes

- Phase 2 tasks T004-T006 must complete before US2 aggregator tests (T011-T013)
- US1 validation (T007-T010) is a high priority and recommended as the MVP deliverable
- Parallelizable tasks are labeled with [P]

Task counts & summary

- Total tasks: 20
- Tasks per story/phase:
  - Setup: 3 (T001-T003)
  - Foundational: 3 (T004-T006)
  - US1 (P1): 4 (T007-T010)
  - US2 (P2): 4 (T011-T014)
  - US3 (P3): 3 (T015-T017)
  - Polish: 3 (T018-T020)

MVP recommendation: Implement US1 (T007-T010) plus the TypeScript types (T003) and unit-tests (T005/T009) so the validation routine can run in CI and block malformed modules.

Location of this file: `specs/001-mcp-module-structure/tasks.md`
