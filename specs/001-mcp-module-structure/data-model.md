# Data Model: MCP Module Structure Enforcement

## Entity: Module Export Package
- **Description**: Represents one Decaf module’s contribution to the MCP server.
- **Fields**:
  - `name` (string, required): Folder name under `src/modules`.
  - `status` (enum `active|disabled`, default `active`): Indicates whether the module should be aggregated.
  - `prompts` (PromptAsset[]): Typed list exported from `<module>/prompts/index.ts`.
  - `resources` (ResourceAsset[]): Typed list exported from `<module>/resources/index.ts`.
  - `templates` (TemplateAsset[]): Typed list exported from `<module>/templates/index.ts`.
  - `tools` (ToolAsset[]): Typed list exported from `<module>/tools/index.ts`.
  - `version` (string, optional): Semantic version to surface in provenance.
  - `lastUpdated` (ISO timestamp): Populated by the validator based on git metadata or file stats.
- **Relationships**: Aggregated into `ModuleRegistry`; contributes assets to `Aggregate Catalog`.
- **Validation Rules**:
  - All four asset arrays MUST be defined; empty arrays require an explicit `status: "disabled"` flag.
  - Asset identifiers (e.g., `id`, `name`) MUST be unique within the module to prevent local conflicts.

## Entity: Asset (Prompt/Resource/Template/Tool)
- **Description**: Generic structure for an MCP-exposed item.
- **Fields**:
  - `id` (string, required): Unique identifier across all modules.
  - `title` (string, required): Human-readable name surfaced to assistants.
  - `description` (string): Guidance for assistant usage.
  - `payload` (object/string): Content (prompt text, resource URL, template body, tool metadata).
  - `tags` (string[]): Optional grouping labels (e.g., `["decoration", "cli"]`).
  - `module` (string, derived): Module provenance injected by the aggregator.
- **Relationships**: Linked back to `Module Export Package` via `module`.
- **Validation Rules**:
  - `id` MUST be globally unique; duplicates trigger aggregation errors.
  - `payload` MUST satisfy MCP schema requirements (e.g., tool definitions include handler metadata).

## Entity: ModuleRegistry
- **Description**: Runtime registry responsible for loading modules, running validation, and exposing aggregate catalogs.
- **Fields**:
  - `packages` (Module Export Package[]): Source of truth for loaded modules.
  - `errors` (ValidationIssue[]): Collection of issues detected during scans.
  - `catalog` (Aggregate Catalog): Computed property for MCP exposure.
- **Relationships**: Consumed by MCP server bootstrap and validation scripts.
- **Validation Rules**:
  - Registry initialization MUST fail fast if `errors` contains any blocking issue.
  - Provides helper methods (`listPrompts`, `listResources`, etc.) that always return provenance-enriched arrays.

## Entity: ValidationIssue
- **Description**: Structured problem emitted by the validator.
- **Fields**:
  - `type` (enum `missing-folder`, `missing-export`, `duplicate-id`, `empty-asset`, `runtime-failure`)
  - `module` (string)
  - `detail` (string)
  - `severity` (enum `error|warning`)
- **Relationships**: Referenced by ModuleRegistry; surfaced in CLI/log output.
- **Validation Rules**:
  - `severity=error` blocks builds/tests; `warning` allows continuation but logs guidance.

## Entity: Aggregate Catalog
- **Description**: The MCP-ready manifest of prompts/resources/templates/tools.
- **Fields**:
  - `prompts`, `resources`, `templates`, `tools` (each Asset[]): Combined and deduplicated arrays.
  - `generatedAt` (ISO timestamp)
  - `moduleCount` (number)
  - `assetCounts` (object: { prompts, resources, templates, tools })
- **Relationships**: Served by the MCP server to FASTMCP clients.
- **Validation Rules**:
  - All asset arrays MUST be sorted deterministically (e.g., by `module` then `id`) for reproducible builds.
  - Catalog generation MUST fail if any arrays contain conflicting identifiers.
