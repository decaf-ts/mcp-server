# Feature Specification: AST → JSDoc Tools

**Feature Branch**: `001-ast-jsdoc-tools`  
**Created**: 2025-10-25  
**Status**: Draft  
**Input**: User description: "Add functional tested tools, prompts, resources and templates to the mcp as required to: TOOL 1 - given a file, extract all TypeScript objects via AST (ast.analysis); TOOL 2 - given an AST object and optional context, apply JSDoc to it according to dedicated prompts (for classes, types, interfaces, modules, namespaces, decorators, functions, CLI modules, constants, enums); TOOL 3 - given a file, run TOOL1 then TOOL2 for each AST object; TOOL 4 - for a target repository, enumerate source .ts files and run TOOL3 for each file, passing contextual hints about the file/object purpose"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bulk repository analysis and JSDoc generation (Priority: P1)

As a developer or maintainer, I want to run a repository-wide tool that finds all TypeScript source files, extracts every exported or relevant symbol, and generates or updates concise, accurate JSDoc comments for each symbol so the codebase has consistent documentation coverage.

**Why this priority**: Improves repository-wide documentation quality and discoverability in a single pass; high developer productivity and easier onboarding.

**Independent Test**: Run the tool for a known sample repo and verify that for each exported symbol, a JSDoc block exists or was updated with meaningful summary and tags where applicable.

**Acceptance Scenarios**:

1. **Given** a repository with TypeScript source files, **When** the bulk tool is executed with repository root and optional context mapping, **Then** every source file is processed and a report of modified/created JSDoc entries is produced.
2. **Given** the tool runs on a repo with no TypeScript files, **When** invoked, **Then** it completes successfully and reports zero files processed.

---

### User Story 2 - Single-file interactive update (Priority: P2)

As a developer, I want to run the tool against a single file to see the extracted AST objects and the suggested JSDoc comments per object, so I can review and apply them selectively.

**Why this priority**: Faster iterative workflow for maintainers who want to selectively adopt documentation changes.

**Independent Test**: Run the single-file command against a sample file and inspect that the tool lists AST objects and produces a JSDoc suggestion per object.

**Acceptance Scenarios**:

1. **Given** a TypeScript file with multiple exports, **When** the single-file command is run, **Then** the tool outputs a list of AST objects and a suggested JSDoc for each object.

---

### User Story 3 - Object-level JSDoc generation (Priority: P3)

As an automated process, I want to provide a single AST object and optional contextual hints and receive a generated JSDoc block tailored to the object type (class, function, enum, etc.) so that the result can be applied programmatically.

**Why this priority**: Enables fine-grained automation and integration into CI or editor workflows.

**Independent Test**: Provide an AST object JSON for a class/function/type and context; verify the produced JSDoc follows expected style and includes tags (param/returns/example) when appropriate.

**Acceptance Scenarios**:

1. **Given** an AST object representing a function with parameters and return type, **When** the object-level generator is invoked, **Then** the JSDoc includes a one-line summary, a description for each parameter, and a returns description.

---

### Edge Cases

- Files with only private (non-exported) symbols: those should be processed but flagged as private and optionally skipped for auto-apply.
- Symbols with no type information (implicit any or inferred types): generator should still create a best-effort summary and mark type details as [NEEDS REVIEW] in the comment.
- Very large files or very large numbers of symbols: tool should produce a progress report and allow batching; failure for resource limits should be reported clearly.
- Conflicting existing JSDoc (human-written but low-quality): tool should not overwrite without explicit flag or should create a suggested update rather than an immediate replace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a tool (TOOL1) that, given a TypeScript source file path, returns a structured list of all AST objects present in that file (modules, classes, functions, interfaces, types, enums, constants, decorators, namespaces, CLI modules), including their name, location, export status, and basic signature information.
- **FR-002**: The system MUST provide a tool (TOOL2) that, given a single AST object and optional contextual hints, returns a suggested JSDoc block tailored to the object type and context.
- **FR-003**: The system MUST provide a tool (TOOL3) that, given a file path, runs TOOL1 on the file and then invokes TOOL2 for each AST object found, producing a per-file report and optionally writing changes to disk when authorized.
- **FR-004**: The system MUST provide a tool (TOOL4) that, given a repository root and an optional source folder path, enumerates all TypeScript source files and runs TOOL3 for each file, accepting a repository-level context mapping for files/objects.
 - **FR-004**: The system MUST provide a tool (TOOL4) that, given a repository root and an optional source folder path, enumerates all TypeScript source files and runs TOOL3 for each file, accepting a repository-level context mapping for files/objects.
 - **FR-011**: TOOL4 MUST, by default, infer per-file and per-object "purpose" using heuristics (filename patterns, directory names such as `cli`, `api`, `lib`, the export surface, and index files). A repository-provided mapping file (e.g., `docs/context.json`) MAY be provided to override heuristics for specific files.
- **FR-005**: Each tool MUST expose a programmatic API and a CLI wrapper to support automation in scripts and CI flows.
- **FR-006**: Tools MUST produce machine-readable reports (JSON) listing files processed, objects found, jsdocs suggested, and actions taken (created/updated/unchanged/failed).
- **FR-007**: Tools MUST be covered by unit tests validating happy paths and at least one non-trivial edge case per tool (e.g., nested namespaces, overloaded functions, generics).
- **FR-008**: Tools MUST allow a dry-run mode where suggestions are reported but not written to files.
- **FR-009**: Tools MUST allow an explicit apply mode that writes JSDoc changes to files and creates a concise git-style patch for review.
- **FR-010**: The project MUST include prompt templates for each AST object type (classes, functions, types, interfaces, modules, namespaces, decorators, constants, enums, CLI modules) used by TOOL2; templates MUST be versioned and testable.

*Notes on unclear aspects:*

- **[NEEDS CLARIFICATION: Source of per-file/object 'purpose' context for TOOL4]** — TOOL4 requires a mapping or heuristic to know the "purpose" of a file/AST object when passing contextual hints to TOOL2. See Clarification section below.

### Key Entities *(include if feature involves data)*

- **AST Object**: A representation of a TypeScript symbol in a file (name, kind, location, signature, export/private, children). Used as input/output by TOOL1 and TOOL2.
- **JSDoc Suggestion**: A text block (summary, description, tags) proposed for an AST Object.
- **File Report**: JSON output for a single file listing AST Objects and per-object suggestion states.
- **Repository Run Report**: Aggregated JSON across files with counts and statuses.

## Prompts & Templates (required)

Provide prompt templates (human-readable and machine-usable) for the following object kinds. Each template must include: 1) short instruction, 2) example input (AST-like) and 3) example expected JSDoc output.

- classes.md: prompt template for classes
- functions.md: prompt template for functions (include params/returns examples)
- types-interfaces.md: prompt template for types and interfaces
- modules-namespaces.md: prompt template for modules and namespaces
- decorators.md: prompt template for decorators
- constants-enums.md: prompt template for constants and enums
- cli-modules.md: prompt template for CLI module entry points

Each template MUST be stored under `specs/001-ast-jsdoc-tools/prompts/` and include at least two unit-testable examples.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a representative codebase (≥50 TypeScript files), the bulk run (TOOL4) MUST produce JSDoc suggestions for at least 90% of exported symbols in one run (measured by suggestions generated / exported symbols).
- **SC-002**: Dry-run reports MUST be generated in under 60 seconds for a codebase with 50 small files on a developer laptop (rough guide; measured empirically during testing).
- **SC-003**: Unit tests MUST achieve coverage for the new tools with at least one test per tool covering a happy path and one edge case.
- **SC-004**: Generated JSDoc blocks for function signatures MUST include parameter names and return description when available in 95% of suggested blocks for typed functions in test fixtures.
- **SC-005**: The tools MUST never modify files unless invoked in explicit apply mode; dry-run and interactive modes MUST not change the working tree.

## Assumptions

- The repository will accept new developer tooling under `tools/` or `src/tools/` and tests will run with the existing project test runner.
- Prompt templates will be used by an internal prompt-execution layer; the spec focuses on content and integration points, not execution platform.
- Reasonable defaults are acceptable for ambiguous cases (e.g., missing type info => use conservative summary and mark for review).

- Implementation hint: the original user request mentioned `ts-morph` as a possible library; this is recorded as an implementation hint and not a mandatory choice.

- Default context source for TOOL4: heuristics based on filename/directory/export surface are the default; repository mapping files are supported as optional overrides.

## Clarifications (questions for the product owner)

### Q1: Source of file/object purpose context

**Context**: TOOL4 needs a way to provide file- or object-level context ("purpose") to TOOL2 so JSDoc can be tailored to how the symbol is used in the repo.

**What we need to know**: Which of the following should be used as the primary source of context?

| Option | Answer | Implications |
|--------|--------|--------------|
| A | A repository-provided mapping file (e.g., docs/context.json) | Precise context; requires maintainers to author mapping files. |
| B | Heuristics based on filename, directory, and export surface | No extra files required; may be less accurate for ambiguous files. |
| C | Use commit history / README sections if present to infer purpose | More accurate but heavier and more complex to implement. |
| Custom | Provide another source or mixture | Specify how to provide it in the repo. |

**Your choice**: _[Wait for user response]_

### Session 2025-10-25

- Q1: Source of file/object purpose context → A: B (Heuristics based on filename, directory, and export surface)

Applied clarification (2025-10-25): TOOL4 will use heuristic inference by default to determine the "purpose" or contextual hints for files and AST objects. Heuristics include filename patterns, directory names (e.g., `cli`, `api`, `lib`, `modules`), the export surface (default export vs named exports), and index files. A repository-provided mapping file (e.g., `docs/context.json`) is optional and can be used to override heuristics for files where precision is required.

Spec updates made:

- Functional Requirements: FR-011 added to describe default heuristic behavior and optional override.
- Assumptions: noted heuristics as default context source and mapping files as optional overrides.

---

## Next steps

1. Create code scaffolding under `tools/ast-jsdoc-tools/` implementing TOOL1..TOOL4 with unit tests and CLI wrappers.
2. Add prompt templates under `specs/001-ast-jsdoc-tools/prompts/` and unit test fixtures under `specs/001-ast-jsdoc-tools/test-fixtures/`.
3. Implement minimal integration test that runs TOOL4 in dry-run mode on test fixtures and asserts SC-001..SC-005.

