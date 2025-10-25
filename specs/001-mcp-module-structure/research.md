# Research: MCP Module Structure Enforcement

## Topic 1: Module Folder Validation Strategy
- **Decision**: Build a `ModuleScaffoldingValidator` utility in `src/utils` that walks every `src/modules/<name>` directory, asserts the presence of `prompts|resources|templates|tools`, and verifies each folder exports a typed array that matches shared interfaces.
- **Rationale**: Centralizing the checks keeps Template Fidelity enforceable and lets `npm run lint`/`npm run test:unit` fail fast with actionable errors before MCP code ever runs.
- **Alternatives Considered**:
  - *A. Manual code review checklist*: Too easy to miss; offers no automated guardrails.
  - *B. Custom ESLint rule*: Would only statically inspect file names, not runtime exports; harder to maintain than a focused validator.

## Topic 2: Aggregation & Deduplication Policy
- **Decision**: Aggregate module exports through a `ModuleRegistry` that loads each module’s index, tags every item with provenance metadata, and rejects duplicates by emitting an error that lists both modules.
- **Rationale**: FASTMCP clients need consistent catalogs; stopping on conflict protects downstream assistants from ambiguous instructions while still letting maintainers resolve the issue quickly.
- **Alternatives Considered**:
  - *A. Last-write-wins*: Silent overwrites would hide bugs and produce unstable MCP manifests.
  - *B. Namespacing per module*: Would force assistants to understand module internals, weakening the “single catalog” goal.

## Topic 3: Runtime Integration with NPM Scripts
- **Decision**: Wire the validator into `npm run lint` (pre-test check) and `npm run test:unit` (as a Jest helper) so Template Fidelity violations block both developer feedback loops and CI, while `npm run prepare-pr` automatically reuses the same hooks.
- **Rationale**: Keeps Automation & Trusted Tooling intact: no new scripts, predictable enforcement, and compatibility with existing CI workflows.
- **Alternatives Considered**:
  - *A. Custom pre-commit hook*: Would miss CI-only environments and duplicate tooling setup.
  - *B. Post-build validation*: Fails too late, only after bundles are generated.

## Topic 4: FASTMCP Exposure Format
- **Decision**: Extend the MCP server composition to expose combined prompts/resources/templates/tools plus provenance via simple JSON lists so coding assistants immediately know which module produced each asset.
- **Rationale**: Aligns with the spec’s enrichment requirement and FASTMCP’s expectation of declarative capability manifests; no protocol-level changes required.
- **Alternatives Considered**:
  - *A. Separate endpoints per module*: Adds discovery complexity for assistants.
  - *B. Static manifest file*: Would require manual refreshes and drift from live modules.
