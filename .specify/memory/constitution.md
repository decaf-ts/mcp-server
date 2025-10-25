<!--
Sync Impact Report
- Version change: none -> 0.1.0
- Modified principles: (new baseline created)
  - (new) I. Test-First Development (TDD)
  - (new) II. Modular Library-First Architecture
  - (new) III. Entrypoint & Project Layout
  - (new) IV. Observability and Deterministic I/O
  - (new) V. Semantic Versioning & Change Governance
- Added sections:
  - Security & Compliance Constraints
  - Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates:
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ⚠ pending manual review (programmatic edit failed)
  - .specify/templates/plan-template.md ⚠ reviewed — contains Constitution Check (no change)
- Follow-up TODOs:
  - RATIFICATION_DATE: TODO(RATIFICATION_DATE): original adoption date unknown — please supply when ratified
-->

# @decaf-ts/mcp-server Constitution

## Core Principles

### I. Test-First Development (TDD)
All feature work follows Test-Driven Development. Tests MUST be authored before implementation and MUST fail initially. The project uses Jest for unit and integration tests. Test artifacts MUST include clear acceptance criteria and independent test cases that validate each user story. Test responsibilities:
- Write failing tests (unit/integration/contract) scoped to the story before implementation.
- Prefer small, focused tests that are fast and deterministic.
- Tests are part of the public specification for the feature and live in `tests/` alongside the implementation.

Rationale: Ensures correctness, prevents regressions, and allows autonomous LLM agents to iterate safely with repeatable checks.


### II. Modular Library-First Architecture
Group related functionality in folders (analogous to namespaces). Code organisation rules:
- One class per file.
- One interface per file (unless the interface is only used as a simple type inline).
- Group shared types in a `types.ts` file per folder.
- Group constants/enums in a `constants.ts` file per folder.
- Group decorators in a `decorators.ts` file per folder.
- Always import from specific files (no folder-level/index imports) except when importing from external packages.
- Prefer established design patterns (factory, strategy, builder, observer). Use singletons sparingly and with clear justification.

Rationale: Predictable structure simplifies automated editing by LLMs and makes review/maintenance explicit.


### III. Entrypoint & Project Layout
Runtime and development layout rules:
- Entrypoint: `./bin/cli.ts`. It MUST only execute when invoked explicitly (CLI invocation guard present).
- Normal development occurs in `./src`.
- Extra module development goes into `./src/modules/<module_name>`; external module sources are located at `../<module_name>` or `github.com/decaf-ts/<module_name>`.
- Implementation artifacts compiled to `lib/` for distribution; `lib/bin/cli.cjs` is the published executable entry.

Rationale: Clear entry points and a consistent layout reduce ambiguity for automated tooling and human contributors alike.


### IV. Observability and Deterministic I/O
All runtime behavior intended for LLM consumption and automated testing MUST be observable and deterministic where practical:
- CLI and service I/O should favor structured, machine-friendly formats (JSON) for contracts and debugging; human-readable output may be provided but MUST have a machine-parsable variant.
- Structured logging (with levels and stable keys) is REQUIRED for components where debugging or audit is expected.
- Errors MUST be surfaced explicitly with codes and helpful messages; stack traces may be included in debug modes only.

Rationale: Observability enables reproducible diagnostics and safe autonomous operation by LLMs.


### V. Semantic Versioning & Change Governance
Constitution and package changes follow semantic versioning. Constitution versioning rules (applied to `.specify/memory/constitution.md`):
- MAJOR (X.y.z): Backwards-incompatible governance or principle removals/redefinitions.
- MINOR (x.Y.z): New principle or section added, or material expansion of guidance.
- PATCH (x.y.Z): Clarifications, typo fixes, and non-semantic wording refinements.

Package-level releases MUST use SemVer and include clear CHANGELOG entries describing breaking changes and migration steps.

Rationale: Explicit versioning reduces ambiguity during automated upgrades and enforces clear migration paths.


## Security & Compliance Constraints
- License: AGPL-3.0-only (see package.json). Contributors MUST ensure compatibility when adding dependencies.
- Node engine: >=20.0.0; npm >=10.0.0. Runtime constraints MUST be declared in `package.json`.
- Secrets MUST NOT be committed. Use environment secrets or a secure vault; CI must check for accidental secrets.
- Dependency changes that add native binaries or change licensing MUST be approved and documented in the PR.


## Development Workflow & Quality Gates
- Pull requests MUST include:
  - Passing tests (unit + integration as applicable).
  - Linting and type checks (ESLint + TypeScript) where relevant.
  - A short summary describing how the change adheres to the Constitution and any deviations.
- Code review: At least one approval from a project maintainer is required for non-trivial changes; breaking changes require explicit maintainer sign-off and a migration plan.
- CI: All branches targeting main/release must pass the full test suite and coverage gates defined in `workdocs/reports/jest.coverage.config.ts` when applicable.


## Governance
All changes to this Constitution follow an explicit amendment procedure:
1. Create a pull request modifying `.specify/memory/constitution.md` with a clear rationale and migration notes.
2. Classify the version bump (MAJOR/MINOR/PATCH) with justification in the PR description.
3. Allow a minimum 7-calendar-day public comment period (or a faster review if all maintainers agree in PR discussion).
4. A simple majority of active maintainers must approve the amendment; breaking governance changes (MAJOR) require explicit maintainers' consensus.
5. Update any affected `.specify/templates/*` artifacts and run the repository validation scripts (`.specify/scripts/bash/check-prerequisites.sh`) as part of the PR checks.

Governance expectations for PRs and feature work:
- Every PR must include a "Constitution Compliance" section indicating: `COMPLIES: Yes|No (explain)` and list any required follow-up tasks if non-compliant.
- Feature specifications (spec.md) MUST reference the Constitution and include explicit tests that validate principle compliance where relevant.

**Version**: 0.1.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2025-10-25