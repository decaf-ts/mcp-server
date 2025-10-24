# Feature Specification: MCP Module Structure Enforcement

**Feature Branch**: `001-mcp-module-structure`  
**Created**: 2025-10-24  
**Status**: Draft  
**Input**: User description: "this repo is an MCP server using FASTMCP to be used by coding assistant LLMs to write code for the decaf-ts typescript framework. keep src/mcp and each folder in ./src/modules with the same structure: - prompts folder that exports a list of prompts for the MCP; - resources folder that export a list of resources for the MCP; - templates folder that export a list of templates; - tools folder that export a list of tools; the main server must consum these exports to enrich"

## User Scenarios & Testing *(mandatory)*

Per the Verification Discipline principle, every story below must be independently implementable and testable without shared mocks; map scenarios directly to `tests/unit`, `tests/integration`, or `tests/bundling` so coverage can be enforced via `npm run coverage`.

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Standardize Module Scaffolding (Priority: P1)

Template maintainers need every `src/modules/*` directory (current and future) to share the same four subfolders—`prompts`, `resources`, `templates`, `tools`—each exporting a strongly-typed list so MCP-compatible assistants can rely on predictable structure.

**Why this priority**: Without structural parity the template cannot be safely re-used in downstream repos, creating integration bugs for every new assistant capability.

**Independent Test**: Run the module validation task against a module (real or stub) and confirm it detects any missing folder/export before allowing the module to be published.

**Acceptance Scenarios**:

1. **Given** a maintainer scaffolds a new module under `src/modules`, **When** the scaffolding script runs, **Then** the four folders plus index exports are created with placeholder lists.
2. **Given** an existing module is missing a folder or list export, **When** validation executes during `npm run lint` or `npm run test:unit`, **Then** it fails with a message naming the offending module and folder.

---

### User Story 2 - Aggregate Module Assets into MCP Server (Priority: P2)

The MCP server maintainer wants `src/mcp` to mirror the same prompts/resources/templates/tools folders and automatically merge each module’s exported lists so FASTMCP sessions expose a unified catalog.

**Why this priority**: Aggregation keeps assistant responses consistent regardless of which modules supply the assets, and prevents manual wiring errors inside the MCP host.

**Independent Test**: Run a targeted integration test that loads only the MCP layer, injects two sample modules, and verifies the server’s exported arrays include every item exactly once.

**Acceptance Scenarios**:

1. **Given** at least one module exports prompts/resources/templates/tools, **When** the MCP server boots, **Then** it imports each module list and makes the concatenated lists available through the FASTMCP interfaces.
2. **Given** two modules export items with identical identifiers, **When** the server aggregates them, **Then** it logs a duplication issue and prevents conflicting entries from being registered.

---

### User Story 3 - LLM Receives Enriched Context (Priority: P3)

Coding assistant LLM operators need every FASTMCP session to present the consolidated prompts, resources, templates, and tools so assistants can reason about the Decaf TS framework without manual lookups.

**Why this priority**: The product’s value is tied to how quickly assistants can discover and use Decaf assets; missing context reduces quality of generated code.

**Independent Test**: Execute an end-to-end run where the MCP server exposes its capability manifest to a mock assistant and verify the assistant receives the enriched artifact lists.

**Acceptance Scenarios**:

1. **Given** a FASTMCP client connects to the Decaf MCP server, **When** it enumerates available prompts/resources/templates/tools, **Then** it sees the aggregated catalog with module provenance metadata.
2. **Given** a module is temporarily disabled, **When** the assistant requests assets, **Then** the catalog excludes that module while still presenting remaining modules without errors.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Module directory exists but only some required folders are present; validation must fail with a clear message and remediation hint.
- Two modules export identically named prompts/resources/templates/tools; aggregation needs deterministic conflict handling (warn, skip, and surface collision in logs/tests).
- MCP root directories contain additional experimental content; validation must ignore non-required folders yet enforce the canonical four.
- Loading dozens of modules simultaneously; aggregation must finish within acceptable startup time without exceeding memory guidance.

## Requirements *(mandatory)*

Trace each requirement back to the Operational Guardrails: specify Node/npm expectations, packaging impacts on `lib/` and `dist/`, documentation updates, and any repository script (`build`, `test:dist`, `prepare-pr`, etc.) the work relies on.

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Every folder under `src/modules/*` MUST contain `prompts`, `resources`, `templates`, and `tools` subfolders, each exporting a typed list of assets consumable by FASTMCP.
- **FR-002**: The `src/mcp` directory MUST mirror the same four folders and expose master lists generated by concatenating the module exports.
- **FR-003**: A validation routine MUST run during `npm run lint` or `npm run test:unit` to fail the pipeline if any module is missing a folder, lacks an export, or produces an empty list without an explicit `disabled` flag.
- **FR-004**: Aggregation MUST detect duplicate asset identifiers across modules and output a deterministic error that points to the offending modules while preventing collisions from reaching clients.
- **FR-005**: Documentation (README/workdocs) MUST describe how to add a new module, the required folder contents, and how the MCP server consumes exports so downstream template users follow the pattern.
- **FR-006**: The MCP server MUST expose provenance metadata (module name and path) alongside each prompt/resource/template/tool so assistants know the source of each asset.
- **FR-007**: All generated code and validation changes MUST maintain compatibility with Node ≥22 / npm ≥10 and keep `npm run build`, `npm run build:prod`, and `npm run test:dist` passing to honor Dual-Target Distribution.

### Key Entities *(include if feature involves data)*

- **Module Export Package**: Conceptual bundle representing one module’s prompts/resources/templates/tools lists plus metadata (module name, version, disabled flag).
- **MCP Aggregate Catalog**: The combined asset arrays exposed by the MCP server after merging all module export packages and performing validation/conflict resolution.
- **Validation Report**: Structured output (console + optional JSON) emitted by the validation routine, capturing missing folders, empty exports, duplicates, and guidance for remediation.

## Assumptions

- Existing modules (`src/modules/decoration`, `src/modules/mcp`, future ones) will be backfilled to the standard without deprecating them.
- Module owners can supply placeholder assets if a folder would otherwise be empty, ensuring validation focuses on structural integrity rather than content completeness.
- FASTMCP clients expect descriptive errors instead of silent degradation, so surfacing validation failures during CI is sufficient to block regressions.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of modules under `src/modules` pass the structural validation routine with zero missing folders or exports before each merge.
- **SC-002**: MCP server startup completes in under 3 seconds with up to 20 modules loaded while still aggregating all asset types.
- **SC-003**: At least 95% of FASTMCP capability manifests generated in testing include provenance metadata for every prompt/resource/template/tool.
- **SC-004**: Documentation updates reduce maintainer setup time for a new module to under 30 minutes as measured by internal onboarding feedback.
