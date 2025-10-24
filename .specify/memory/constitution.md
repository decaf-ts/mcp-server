<!--
Sync Impact Report
Version: 0.0.0 → 1.0.0
Modified Principles:
- PRINCIPLE_1_NAME → Template Fidelity
- PRINCIPLE_2_NAME → Dual-Target Distribution
- PRINCIPLE_3_NAME → Verification Discipline
- PRINCIPLE_4_NAME → Documentation & Observability
- PRINCIPLE_5_NAME → Automation & Trusted Tooling
Added Sections:
- Operational Guardrails
- Delivery Workflow & Quality Gates
Removed Sections:
- None
Templates Requiring Updates:
- ✅ .specify/templates/plan-template.md (Constitution Check aligned with the five principles)
- ✅ .specify/templates/spec-template.md (User story + guardrail guidance)
- ✅ .specify/templates/tasks-template.md (Testing + path guardrails)
Follow-up TODOs:
- None
-->
# Decaf MCP Server Constitution

## Core Principles

### I. Template Fidelity
- Keep all production TypeScript under `src/`, re-export the public surface through `src/index.ts`, and add new entry points only with documented architectural approval.
- Tests MUST live exclusively in `tests/unit`, `tests/integration`, or `tests/bundling` and follow the `*.test.ts` convention; adding new test roots requires a governance decision.
- Update the CLI help, README, and workdocs whenever behavior or commands change so template adopters always receive accurate instructions.
**Rationale**: This repository is the canonical Decaf TypeScript template; structural drift or stale documentation propagates mistakes across every downstream project.

### II. Dual-Target Distribution
- Every change that touches source, build tooling, or dependencies MUST run `npm run build` and `npm run build:prod`, ensuring both emit CJS and ESM artifacts to `lib/` and bundled outputs to `dist/`.
- Maintain parity between the published exports (`import`/`require`) and the CLI binary at `lib/bin/cli.cjs`; the shebang and chmod logic belongs to `npm run make-exec` and must not be bypassed.
- When bundler or packaging behavior changes, run `npm run test:dist`, note the semver impact, and document upgrade guidance before merging.
**Rationale**: Consumers depend on predictable dual-module consumption and a working CLI; drift in packaging silently breaks template-generated services.

### III. Verification Discipline
- Start work by updating the relevant `.specify` spec/plan/tasks files and writing the failing unit or integration tests before implementation whenever practical.
- Unit suites may not mock internal modules; cross-module or CLI behaviors move to `tests/integration` or `tests/bundling` where full flows can be asserted.
- `npm run coverage` (which drives `test:all`) is mandatory before merge, and coverage artifacts must be refreshed under `workdocs/reports/data/`; regressions require maintainer approval plus remediation tasks.
**Rationale**: The template must remain trustworthy; enforcing fail-first tests and published coverage stops regressions from propagating to every repository cloned from this project.

### IV. Documentation & Observability
- Keep README content, `docs/` output, and `workdocs/tutorials` synchronized with the latest commands, environment expectations, and onboarding steps.
- Regenerate diagrams and visual assets through `npm run drawings` and `npm run uml`, copying results into `workdocs/resources/` whenever flows, schemas, or contracts change.
- Preserve structured logging and telemetry through CLI/stdout so template users can debug via text streams or JSON parsers without additional tooling.
**Rationale**: Documentation and traceability are the only way downstream teams can adopt, troubleshoot, and extend the template without direct maintainer involvement.

### V. Automation & Trusted Tooling
- Use the provided npm scripts for installation, linting, builds, publishing, and repo automation (`do-install`, `prepare-pr`, `repo:*`, `docker:*`, `sync-codex`); deviations must be justified in-plan and reviewed.
- Secrets live only in the token files (`.token`, `.npmtoken`, `.dockeruser`, `.dockertoken`, `.confluence-token`) and are referenced through scripts—never echoed into history or config.
- Codex automation outputs (plan/spec/tasks/checklist) are authoritative for scope, gates, and acceptance; implementation may not skip steps without updating those artifacts.
**Rationale**: Reproducible automation and disciplined secret handling keep releases safe and auditable across contributors and CI environments.

## Operational Guardrails

- **Environment**: Develop and test with Node ≥22 and npm ≥10; verify the CLI inside the same Debian-based containers that CI uses to avoid platform drift.
- **Source Layout**: Keep TypeScript in `src/`, generated declarations/JS in `lib/`, bundled artifacts in `dist/`, documentation inputs in `workdocs/`, and auto-generated docs in `docs/`.
- **Build & Docs Pipelines**: Run `npm run build` for development, `npm run build:prod` for releases, `npm run docs` for the static site, and `npm run drawings`/`npm run uml` before publishing refreshed diagrams.
- **Quality Commands**: `npm run lint`, `npm run coverage`, and (when applicable) `npm run test:dist` must succeed locally before opening a PR; `npm run prepare-pr` ties them together for release confidence.
- **Credentials & Distribution**: Consume registry, Docker, and Confluence credentials only through the scripted commands; treat `lib/` and `dist/` as generated artifacts that must not be hand-edited.

## Delivery Workflow & Quality Gates

1. **Specification First**: Capture the user stories and requirements in `specs/feature-key/spec.md` (where `feature-key` matches the branch slug), instantiate `plan.md` via `/speckit.plan`, and ensure the Constitution Check passes before any coding.
2. **Task Breakdown**: Generate `specs/feature-key/tasks.md` grouped by user story so each increment is independently testable, aligning with the Verification Discipline principle.
3. **Implementation**: Keep code within the sanctioned directories, write failing tests, then implement; integration changes must note which npm scripts or docs they impact.
4. **Pre-PR Validation**: Run `lint`, `build:prod`, `coverage`, `docs`, and `test:dist` when packaging or CLI behavior shifts; attach coverage and doc artifacts (or deltas) to the PR.
5. **Review & Merge**: Reviewers verify that principles are honored, documentation is updated, and any deviations are logged in the Complexity Tracking table plus governance notes.

## Governance

- **Supremacy**: This constitution overrides conflicting docs; any discrepancy must be resolved by updating the subordinate doc or amending this file.
- **Amendment Process**:
  1. Open a governance issue describing the needed change and whether it is Major, Minor, or Patch.
  2. Draft updates to this constitution plus all dependent templates/docs, including a refreshed Sync Impact Report.
  3. Run `npm run prepare-pr`, attach the diff, and secure approval from at least one project maintainer.
  4. Communicate migration steps (if any) in README or release notes before merging.
- **Versioning**: Bump MAJOR when removing/redefining principles or governance; bump MINOR for new principles/sections or substantial guidance expansions; bump PATCH for clarifications or typo fixes. Document the bump rationale inside the Sync Impact Report and PR description.
- **Compliance Review**: Maintainers audit compliance quarterly and before every release tag, sampling recent merges to ensure Template Fidelity, build outputs, documentation, and automation requirements remain in force. Non-compliant work is rolled back or hot-fixed immediately.

**Version**: 1.0.0 | **Ratified**: 2025-10-24 | **Last Amended**: 2025-10-24
