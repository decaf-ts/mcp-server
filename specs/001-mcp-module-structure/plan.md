# Implementation Plan: MCP Module Structure Enforcement

**Branch**: `001-mcp-module-structure` | **Date**: 2025-10-24 | **Spec**: `/home/tvenceslau/local-workspace/decaf-ts/mcp-server/specs/001-mcp-module-structure/spec.md`
**Input**: Feature specification from `/specs/001-mcp-module-structure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Guarantee every `src/modules/*` directory follows an identical structure (`prompts`, `resources`, `templates`, `tools`) with typed exports, add repository automation that validates those folders during lint/test, and extend the FASTMCP server under `src/mcp` to aggregate module exports (with provenance + deduplication) so connected coding assistants always receive an enriched Decaf TS catalog.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.8.x targeting Node.js ≥22  
**Primary Dependencies**: FASTMCP 3.20, @decaf-ts shared libs, internal scaffolding utilities  
**Storage**: N/A (in-memory module registry only)  
**Testing**: Jest (unit + integration) with `npm run test:unit`, `npm run test:all`, `npm run test:dist`  
**Target Platform**: Node CLI/server environments (local dev, CI containers, FASTMCP clients)
**Project Type**: Single-package CLI/server template  
**Performance Goals**: MCP startup aggregates ≤20 modules in under 3 seconds; validation runs complete within 2 seconds per module set  
**Constraints**: Must keep code in `src/`, exports consolidated via `src/index.ts`; no new runtime deps without maintainer review; validation must run inside existing scripts (lint/test)  
**Scale/Scope**: Expect 5–20 modules initially with growth to dozens across template consumers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Template Fidelity**: New validation utilities will live under `src/utils` + `src/modules/*` without adding extra entry points; documentation updates (README + workdocs) will explain the enforced folder layout and MCP wiring.
- **Dual-Target Distribution**: Aggregation/validation logic executes during builds, so `npm run build`, `npm run build:prod`, and `npm run test:dist` must be updated to import the shared registry; CI will block if bundles fail to include the canonical exports.
- **Verification Discipline**: Introduce Jest unit suites covering the validator plus integration tests that spin up the MCP host with fixture modules; no mocks for module interactions—use real folder fixtures inside `tests/integration`.
- **Documentation & Observability**: Update README, docs site, and workdocs tutorials describing module scaffolding, plus ensure MCP logging surfaces duplicate/disabled module info for assistant operators.
- **Automation & Trusted Tooling**: Extend existing npm scripts (`lint`, `test:all`, `prepare-pr`) to invoke the validator; leverage `.specify` automation for plan/tasks and keep secrets isolated in existing token files. No custom shell outside repo scripts.

**Gate Evaluation**: All principles can be satisfied with the design above; no violations anticipated, so Complexity Tracking remains empty. Re-evaluate after Phase 1 deliverables to confirm tooling/documentation updates stay aligned.

Any violation must be captured in the Complexity Tracking table with the justification and maintainer approval.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── mcp/                   # FASTMCP server composition + prompts/resources/templates/tools
├── modules/               # Feature-specific submodules (decoration, mcp, future)
│   ├── <module>/prompts/
│   ├── <module>/resources/
│   ├── <module>/templates/
│   └── <module>/tools/
├── utils/                 # Shared validators/helpers
├── index.ts               # Public re-export surface
└── ...

tests/
├── unit/                  # Validator + registries
└── integration/           # MCP bootstrap + aggregation scenarios
```

**Structure Decision**: Single TypeScript package rooted at `src/` with tests under `tests/{unit,integration}`; new validation/aggregation code stays within these directories to honor template fidelity.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
