# Implementation Tasks: AST → JSDoc Tools

## Phases Overview

1. Setup: Project structure and dependencies
2. Foundational: Core AST analysis functionality
3. User Story 1: Bulk repository analysis (P1)
4. User Story 2: Single file interactive update (P2)
5. User Story 3: Object-level JSDoc generation (P3)
6. Polish: Documentation and final testing

## Implementation Strategy

### MVP Scope
- User Story 1 (Bulk repository analysis)
- Core AST analysis with ts-morph
- Basic JSDoc generation
- Dry-run functionality

### Incremental Delivery
1. Core AST extraction (TOOL1)
2. Basic JSDoc generation (TOOL2)
3. File-level processing (TOOL3)
4. Repository-wide processing (TOOL4)

## Tasks

### Phase 1: Setup

- [ ] T001 Initialize tools directory structure in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools
- [ ] T002 [P] Create package.json with ts-morph dependency in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/package.json
- [ ] T003 [P] Configure TypeScript settings in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/tsconfig.json
- [ ] T004 Create base CLI structure in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/cli.ts
- [ ] T005 [P] Set up test environment in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/jest.config.ts

### Phase 2: Foundational

- [ ] T006 Create AST Object interface in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/types/ast.ts
- [ ] T007 Create JSDoc interfaces in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/types/jsdoc.ts
- [ ] T008 Create Report interfaces in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/types/reports.ts
- [ ] T009 Implement ts-morph initialization in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/utils/ts-project.ts
- [ ] T010 Create JSDoc template engine in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/templates/engine.ts

### Phase 3: User Story 1 - Bulk Repository Analysis (P1)

**Goal**: Enable repository-wide JSDoc generation with heuristic-based context
**Test**: Run against sample repo, verify JSDoc coverage for exported symbols

- [ ] T011 [P] [US1] Create sample test fixtures in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/fixtures/repo
- [ ] T012 [US1] Implement TOOL1 (AST extraction) in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/tools/ast-extractor.ts
- [ ] T013 [US1] Implement TOOL2 (JSDoc generation) in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/tools/jsdoc-generator.ts
- [ ] T014 [US1] Implement TOOL3 (file processor) in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/tools/file-processor.ts
- [ ] T015 [US1] Create heuristic rules engine in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/utils/heuristics.ts with:
  - Directory-based rules (api/, cli/, lib/, etc.)
  - Filename pattern rules (*.controller.ts, *.cli.ts, etc.)
  - Export analysis rules (default exports vs named exports)
  - Index file special handling
- [ ] T016 [US1] Implement TOOL4 (repo processor) in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/tools/repo-processor.ts
- [ ] T017 [US1] Add bulk processing CLI commands in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/cli/repo-commands.ts
- [ ] T018 [P] [US1] Create integration test for bulk processing in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/integration/repo-processor.test.ts

### Phase 4: User Story 2 - Single File Interactive Update (P2)

**Goal**: Enable single-file processing with review capability
**Test**: Run against test file, verify AST extraction and JSDoc suggestions

- [ ] T019 [P] [US2] Create test fixtures for single file in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/fixtures/single
- [ ] T020 [US2] Add interactive mode to file processor in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/tools/file-processor.ts
- [ ] T021 [US2] Implement suggestion review interface in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/cli/interactive.ts
- [ ] T022 [US2] Add single file CLI commands in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/cli/file-commands.ts
- [ ] T023 [P] [US2] Create integration test for single file mode in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/integration/file-processor.test.ts

### Phase 5: User Story 3 - Object-level JSDoc Generation (P3)

**Goal**: Enable programmatic JSDoc generation for individual AST objects
**Test**: Provide AST object JSON, verify accurate JSDoc generation

- [ ] T024 [P] [US3] Create test fixtures for AST objects in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/fixtures/objects
- [ ] T025 [US3] Implement object-level JSDoc API in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/api/object-jsdoc.ts
- [ ] T026 [US3] Add programmatic interface in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/src/index.ts
- [ ] T027 [P] [US3] Create unit tests for object-level JSDoc in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/test/unit/object-jsdoc.test.ts

### Phase 6: Polish

- [ ] T028 Add detailed API documentation in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/README.md
- [ ] T029 Create example scripts in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/examples
- [ ] T030 Add performance benchmarks in /home/tvenceslau/local-workspace/decaf-ts/mcp-server/tools/ast-jsdoc-tools/benchmarks

## Dependencies

### Story Dependencies
```
US1 (P1) → Independent
US2 (P2) → Requires TOOL1, TOOL2
US3 (P3) → Requires TOOL2
```

### Parallel Execution Opportunities

**Setup Phase**:
- T002, T003, T005 can run in parallel (config files)

**User Story 1**:
- T011, T018 can run in parallel (tests)
- T012, T013 can run in parallel (core tools)

**User Story 2**:
- T019, T023 can run in parallel (tests)

**User Story 3**:
- T024, T027 can run in parallel (tests)

## Task Summary

- Total Tasks: 30
- Tasks per Story:
  - Setup: 5 tasks
  - Foundational: 5 tasks
  - US1 (P1): 8 tasks
  - US2 (P2): 5 tasks
  - US3 (P3): 4 tasks
  - Polish: 3 tasks
- Parallel Opportunities: 10 tasks
- Independent Test Criteria: Defined for each user story
- MVP Scope: User Story 1 (T011-T018)

All tasks follow required checklist format with:
- Checkbox
- Task ID
- [P] marker when parallelizable
- Story label for user story tasks
- Clear file paths