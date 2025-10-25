# Implementation Plan: AST → JSDoc Tools

**Branch**: `001-ast-jsdoc-tools` | **Date**: 2025-10-25 | **Spec**: `specs/001-ast-jsdoc-tools/spec.md`
**Input**: Feature specification from `specs/001-ast-jsdoc-tools/spec.md`

**Note**: This plan follows the repository's constitution and the spec in `spec.md`.

## Summary

Build a small suite of developer tools to extract TypeScript AST objects from files and generate
or update JSDoc comments per-object using dedicated prompt templates. Deliverables:

- TOOL1: `ast.extract` — programmatic AST extractor (file → list of AST objects)
- TOOL2: `jsdoc.for-object` — object-level JSDoc suggestion generator driven by prompt templates
- TOOL3: `jsdoc.for-file` — runs TOOL1 then TOOL2 for a single file (dry-run / apply modes)
- TOOL4: `jsdoc.for-repo` — enumerates repo `.ts` files and runs TOOL3 using heuristics for context
- Prompt templates and test fixtures under `specs/001-ast-jsdoc-tools/prompts/` and `test-fixtures/`

Primary outcomes: machine-readable reports (JSON), CLI wrappers, unit tests and an integration
dry-run demonstrating SC-001..SC-005 from the spec.

## Technical Context

**Language/Version**: TypeScript (Node.js 16+ recommended; development environment lists Node 20)
**Primary Dependencies**: ts-morph (recommended for AST extraction) — optional implementation
  detail; jest for tests; a small CLI helper (commander or yargs) for CLI wrappers.
**Storage**: N/A (writes to files only when in apply mode; otherwise dry-run reports only)
**Testing**: Jest (unit + integration fixtures under `tests/` and `specs/.../test-fixtures`)
**Target Platform**: Developer machines and CI (Linux/macOS; Node.js runtime)
**Project Type**: Single-tools package under `tools/ast-jsdoc-tools/` inside this repo
**Performance Goals**: Dry-run for a representative 50-file codebase should complete under 60s on
  a modern developer laptop (guideline; measure during integration test)
**Constraints**: Tools MUST support dry-run (no file modifications) and explicit apply mode; must
  produce JSON reports; must not introduce breaking changes to source files unless explicitly
  approved via apply mode and git-style patch output.
**Scale/Scope**: Tool is intended for codebases up to a few thousand TS files for now; very large
codebases may require batching.

## Constitution Check

This plan was evaluated against the project constitution. Status for impacted principles:

- Code Organization & Module Boundaries: Complies - Tools placed under `tools/ast-jsdoc-tools/` and
  will not change repository module boundaries by default.
- File & Export Conventions: Complies - Tools will read files and suggest JSDoc; they do not
  change export patterns. Any change to file structure is explicitly disallowed by default.
- Test-First Quality: Complies - Unit tests and integration fixtures will be created prior to code
  changes; dry-run integration test included in acceptance criteria.
- Design Patterns: Complies - Implementation will use clear patterns (Extractor, Generator, Orchestrator)
  and justify any additional patterns in code comments and plan tasks.
- Review/CI/Observability: Complies - CI jobs will run new unit tests; tools produce JSON reports and
  logs for observability. Any CI config changes will be proposed in PR.

No Violations detected. Proceeding to Phase 0 research.

## Project Structure (proposed)

Top-level additions:

``text
tools/ast-jsdoc-tools/
├── src/
│   ├── lib/                 # core modules (ast.analysis, jsdoc.generate, orchestrator)
│   ├── cli/                 # CLI wrappers
│   └── index.ts
├── bin/                     # small CLI entrypoint scripts
├── tests/                   # unit & integration tests
└── package.json             # local package manifest for the tools

specs/001-ast-jsdoc-tools/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── prompts/
└── test-fixtures/
```

## Phase 0: Outline & Research (deliverable: research.md)

Unknowns / decisions to be resolved in research.md:

1. Confirm AST library approach: use `ts-morph` (recommended) vs. raw TypeScript compiler API.
2. Define prompt template format for each object kind and examples.
3. Define file/context heuristics for TOOL4 (already selected: heuristics; include examples and tests).

Research outputs will record decisions, rationale, and alternatives.

## Phase 1: Design & Contracts (expected outputs)

1. `data-model.md`: Entity descriptions (AST Object, JSDoc Suggestion, File Report, Repo Report).
2. `contracts/README.md`: CLI contract documentation and example JSON report schema.
3. `quickstart.md`: How to run tools in dry-run and apply modes for contributor onboarding.

## Complexity Tracking

No constitution violations identified. No exceptional complexity gating required at this time.

