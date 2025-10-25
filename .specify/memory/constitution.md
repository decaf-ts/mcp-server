<!--
Sync Impact Report

- Version change: 1.0.0 → 1.0.1 (PATCH)
- Modified / Added Principles:
	- Core principles unchanged; clarifications and operational guidance added for tooling and CLI workflows.
- Added sections: none (existing sections clarified)
- Removed sections: none
- Templates / Files updated by this amendment:
	- specs/001-ast-jsdoc-tools/quickstart.md ✅ updated (interactive CLI example added)
	- specs/001-ast-jsdoc-tools/tasks.md ✅ updated (interactive tasks marked completed)
	- .specify/templates/plan-template.md ✅ reviewed (no breaking changes required)
	- .specify/templates/tasks-template.md ⚠ pending review (no mandatory edits made)
	- .specify/templates/spec-template.md ⚠ pending review (aligns with principles)
- Follow-up TODOs:
	- RATIFICATION_DATE resolved: 2025-10-25 (entered during Sync Impact amendment)
	- Run a quick manual verification using `npm run server:dev` and `npm run server` to ensure MCP exports expected tools/prompts/resources after the interactive CLI is exercised.
	- Optionally add `docs/context.json` schema if repositories adopt explicit mapping overrides for TOOL4 (recommended for large repos).
-->

# Decaf MCP Server Constitution

## Core Principles

### I. Code Organization & Module Boundaries
All related functionality MUST be grouped in folders that act as logical modules (analogous to namespaces).
Folders define module boundaries; avoid implicit cross-folder dependencies. Each folder should have a
clear purpose and a small export surface.

Rationale: Physical layout (folders/files) is the primary mechanism we use to express architecture
and to keep surface area small when reviewing and testing changes.

### II. File & Export Conventions
- One class per file. Each class file MUST export the class explicitly.
- One interface per file unless the interface exists solely as an inline type for a single file.
- Types that group multiple interfaces SHOULD be placed in a `types.ts` file within the folder.
- Constants and enums SHOULD be placed in a `constants.ts` file within the folder.
- Decorators SHOULD be placed in a `decorators.ts` file within the folder.
- Pure/utils functions SHOULD be grouped in a `utils.ts` file or a small set of named files per
	related functionality; limit the number of exported utilities.
- Always import from the specific file path (e.g., `import X from '../module/x'`) rather than from
	a folder index. The only exceptions are external package entry points and deliberate package
	boundaries.

Rationale: These rules reduce merge conflicts, clarify ownership, and make static analysis and
automated tooling more reliable.

### III. Test-First Quality (NON-NEGOTIABLE)
- Tests MUST be authored for each new public behavior prior to implementation (unit tests at a
	minimum). Integration tests are required for cross-module contracts.
- The repository gating policy requires: linting pass, unit tests pass, and coverage thresholds
	respected for changed code.

Rationale: Tests are the contract for future maintainers and are enforced by CI checks.

### IV. Design Patterns & Simplicity
- Prefer established design patterns (Factory, Strategy, Observer, Builder) where they reduce
	complexity and improve testability. Avoid misuse of Singleton unless justified.
- Prefer composition over inheritance and favor small, focused interfaces.

Rationale: Patterns are aids, not rules; use them when they clarify intent and reduce duplication.

### V. Review, CI, Observability & Release Discipline
- Every PR MUST include a clear purpose and link to the feature spec or issue.
- CI MUST run linting, unit tests, and basic integration checks for the affected modules.
- Documentation updates and test coverage artifacts SHOULD be part of the PR when user-facing
	behavior changes.
- Releases MUST follow semantic versioning and use the repository `npm run release` flow.

Rationale: Automated checks and clear PRs prevent regressions and keep release artifacts trustworthy.

## Constraints & Tooling
- Node.js: supported versions declared in `package.json` (follow repo guidance; defaults may be
	Node 16+; check `workdocs/tutorials/For Developers.md` for project-specific notes).
- CI: GitHub Actions / GitLab CI pipelines MUST run lint, tests, build, and docs where relevant.
- Documentation: `npm run docs` generates the compiled docs; use `workdocs/tutorials/For Developers.md`
	for developer onboarding commands (set-git-auth, do-install, update-scripts, build, test, docs).

Rationale: Make development, CI, and docs reproducible across developer machines and CI environments.

## Development Workflow & Quality Gates
- Branch naming and feature spec conventions from `.specify/` MUST be followed for new features.
- Before merging a feature PR, ensure:
	- Spec exists and passes the Constitution Check in `plan.md`.
	- Unit tests and linting pass for changed files.
	- Any new public API changes are documented.
- The `plan.md` generated from `/speckit.plan` MUST include a short "Constitution Check" section
	that lists which principles are impacted and how the proposed changes comply.

Rationale: Embedding the constitution check in planning reduces last-minute policy surprises during
reviews and ensures architectural coherence.

## Governance
- Amendments to this constitution MUST be made via pull request and require at least two approvals
	from repository maintainers (or the designated governance group).
- Amendments MUST include a migration plan for any rules that affect existing code (e.g., file
	layout changes, export surface changes).
- Versioning: Semantic versioning is used for the constitution document itself. Initial ratification
	uses version `1.0.0`. Patch bumps are for wording clarifications; minor bumps for added
	principles; major bumps for redefinitions or removals.

**Version**: 1.0.1 | **Ratified**: 2025-10-25 | **Last Amended**: 2025-10-25
