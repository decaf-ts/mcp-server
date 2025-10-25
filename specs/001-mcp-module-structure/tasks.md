---

description: "Task list for MCP Module Structure Enforcement"

---

# Tasks: MCP Module Structure Enforcement

**Input**: Design documents from `/specs/001-mcp-module-structure/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: User stories call out validation and FASTMCP integration checks. Dedicated Jest test tasks are included under each story.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. All code updates stay under `src/` and tests under `tests/{unit,integration}` to preserve Template Fidelity.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare fixtures and documentation scaffolding required across all stories.

- [ ] T001 Create module fixture documentation at `tests/fixtures/modules/README.md` describing how sample modules support validator and integration scenarios.
- [ ] T002 Scaffold `tests/fixtures/modules/sample-module/{prompts,resources,templates,tools}/index.ts` with placeholder exports for use across unit and integration tests.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared typings and helpers that every user story depends on.

- [ ] T003 Define shared `PromptAsset`, `ResourceAsset`, `TemplateAsset`, `ToolAsset`, and `ModuleExportPackage` interfaces in `src/types.ts` and re-export them via `src/index.ts`.
- [ ] T004 Implement `listModuleFolders` and disabled-module filtering utilities in `src/utils/modulePaths.ts` to enumerate `src/modules/*`.
- [ ] T005 Add Jest helper utilities at `tests/unit/__helpers__/moduleFixtures.ts` to load fixture modules and clean up temporary folders across suites.

---

## Phase 3: User Story 1 - Standardize Module Scaffolding (Priority: P1) 🎯 MVP

**Goal**: Enforce the required `prompts/resources/templates/tools` folders for every module and fail CI when structure drifts.

**Independent Test**: Run the module validation command against a real or fixture module and confirm it reports missing folders/exports before the module can ship.

### Tests for User Story 1 ⚠️

- [ ] T010 [US1] Add Jest unit coverage in `tests/unit/moduleValidator.test.ts` to assert the validator passes compliant modules and fails cases with missing folders, empty exports, or disabled flags.

### Implementation for User Story 1

- [ ] T006 [US1] Implement `ModuleScaffoldingValidator` in `src/utils/moduleValidator.ts` to verify required folders exist and exports return typed arrays (with disabled-module handling).
- [ ] T007 [US1] Add a CLI runner in `src/bin/validate-modules.ts`, expose it via a `validate:modules` npm script in `package.json`, and invoke it inside `npm run lint` and Jest setup.
- [ ] T008 [P] [US1] Backfill `src/modules/decoration` with `prompts`, `resources`, `templates`, and `tools` subdirectories plus `index.ts` files exporting typed lists.
- [ ] T009 [P] [US1] Backfill `src/modules/mcp` with the same four subdirectories and exports so it complies with the validator.
- [ ] T011 [US1] Document the scaffolding rules in `README.md` and `workdocs/tutorials/ModuleStructure.md`, including instructions for creating placeholder assets and marking modules disabled.

---

## Phase 4: User Story 2 - Aggregate Module Assets into MCP Server (Priority: P2)

**Goal**: Replace hand-wired MCP lists with an automated registry that merges every module’s exports and blocks duplicates.

**Independent Test**: Execute the integration test that boots the MCP layer with two fixture modules and verifies the aggregated arrays include each asset exactly once.

### Tests for User Story 2 ⚠️

- [ ] T015 [US2] Add integration coverage in `tests/integration/mcp/moduleRegistry.int.test.ts` to confirm the registry loads multiple modules, surfaces provenance, and errors on duplicate IDs.

### Implementation for User Story 2

- [ ] T012 [US2] Build `ModuleRegistry` in `src/mcp/moduleRegistry.ts` to import every module’s exports, attach provenance metadata, and expose `listPrompts/resources/templates/tools`.
- [ ] T013 [US2] Update `src/mcp/prompts/index.ts`, `src/mcp/resources/index.ts`, `src/mcp/templates/index.ts`, and `src/mcp/tools/index.ts` to re-export the registry-provided arrays.
- [ ] T014 [US2] Extend `src/mcp/moduleRegistry.ts` with duplicate-ID detection and structured error logging that halts startup when conflicts occur.

---

## Phase 5: User Story 3 - LLM Receives Enriched Context (Priority: P3)

**Goal**: Ensure FASTMCP clients automatically receive the aggregated catalog with provenance whenever they connect.

**Independent Test**: Run an end-to-end FASTMCP manifest test that inspects the capability response and confirms all prompts/resources/templates/tools include module metadata.

### Tests for User Story 3 ⚠️

- [ ] T018 [US3] Create an end-to-end FASTMCP test at `tests/integration/mcp/fastmcpManifest.int.test.ts` that boots the server, connects a mock client, and asserts the manifest contains the aggregated catalog.

### Implementation for User Story 3

- [ ] T016 [US3] Update `src/mcp/index.ts` and `src/mcp/mcp-module.ts` so the exposed MCP capabilities return registry data plus provenance fields.
- [ ] T017 [P] [US3] Extend session/workspace handling in `src/mcp/workspace.ts` and `src/mcp/code.ts` to broadcast the aggregated prompts/resources/templates/tools when assistants request context.
- [ ] T019 [US3] Refresh `README.md` and `workdocs/tutorials/ModuleStructure.md` with instructions for consuming the enriched MCP catalog, disabling modules, and troubleshooting duplicate warnings.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, automation, and release readiness.

- [ ] T020 Update `workdocs/tutorials/For Developers.md` and `specs/001-mcp-module-structure/quickstart.md` with the final validation + registry workflow.
- [ ] T021 Regenerate documentation via `npm run docs` and commit changes under `docs/` so onboarding instructions match the new module processes.
- [ ] T022 Run `npm run coverage`, `npm run test:dist`, and `npm run prepare-pr`, capturing updated reports under `workdocs/reports/data/` for reviewer verification.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: Must complete before creating validators or registries so tests have fixtures to consume.
- **Foundational (Phase 2)**: Depends on Setup; provides typings/helpers required by all user stories.
- **User Story 1 (Phase 3)**: Builds on Foundational so the validator can rely on shared types and fixtures. This story is the MVP and must ship before US2/US3.
- **User Story 2 (Phase 4)**: Requires US1 to guarantee module outputs are consistent before aggregation. Independent once validator is stable.
- **User Story 3 (Phase 5)**: Depends on US2’s registry outputs to expose enriched manifests.
- **Polish (Phase 6)**: Runs after all user stories to finalize docs and validation commands.

## Parallel Opportunities

- In **US1**, tasks T008 and T009 modify separate module directories and can run in parallel after the validator (T006) lands.
- In **US2**, once `ModuleRegistry` (T012) is implemented, documentation wiring (T013) and duplicate-handling refinements (T014) can proceed concurrently by different contributors.
- In **US3**, provenance propagation (T016) and workspace broadcasting updates (T017) operate on different files, enabling parallel execution before the end-to-end manifest test (T018).

## Implementation Strategy

1. **MVP (US1)**: Complete Setup, Foundational, and all User Story 1 tasks to enforce module scaffolding and validation. Ship as soon as validator + docs are ready.
2. **Incremental Delivery**:
   - **Increment 2 (US2)**: Add the ModuleRegistry aggregation and integration tests so MCP hosts consume module exports automatically.
   - **Increment 3 (US3)**: Expose the enriched catalog to FASTMCP clients and finalize user-facing documentation.
3. **Polish**: Regenerate docs, run full test/coverage suites, and capture artifacts for reviewers prior to merge or release.
