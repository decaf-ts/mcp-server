# Checklist: Author-driven Quality Gate — MCP Module Structure

Audience: Spec Author
Scope: Functional requirements only (no NFRs)
Depth: Lightweight (minimal items to unblock implementation)

How to use:
- Mark each item as done with `✅` when complete, or `❌` when failing.
- This checklist is intended to be run by the spec author before opening a PR.
- After completing items here, run the repository prerequisite check and validator:

```bash
# from repo root
./.specify/scripts/bash/check-prerequisites.sh --json --include-tasks
npm run validate:modules || npm run validate-modules
```

Summary: this checklist ensures `spec.md`, plan, tasks and minimal repo wiring exist so developers can implement the MCP aggregation and validation features.

---

CHK-001 — Spec completeness (core sections)
- [ ] Title, Feature Branch, Created, Status filled.
- [ ] "User Scenarios & Testing" contains at least 3 independent user stories with priorities and a clear independent test per story.
- [ ] "Requirements" section lists FR-001..FR-007 (no placeholders left).
- [ ] "Success Criteria" contains measurable outcomes (no TODO placeholders).

Remediation hints:
- Replace placeholder paragraphs with concrete values (e.g. Node/npm engines, scripts used).

CHK-002 — Implementation plan
- [ ] `plan.md` exists in the feature directory and describes implementation steps (scaffolding, validator, aggregator, tests, CI updates).
- [ ] Each plan step maps to one or more files to create or edit.

Remediation hints:
- If missing, copy the current spec acceptance scenarios into `plan.md` and add step-by-step tasks.

CHK-003 — Tasks present for implementation
- [ ] `tasks.md` exists and enumerates developer tasks (scaffold, validator script, npm script, MCP aggregator, unit+integration tests, docs, CI changes).
- [ ] Each task has an owner (or placeholder `@owner`) and an estimated complexity (S/M/L).

Remediation hints:
- Create a minimal `tasks.md` listing tasks from the plan; the prerequisite checker may require this when running implement-phase checks.

CHK-004 — Validator presence & script name
- [ ] A validator script exists at `scripts/validate-modules.js` OR `scripts/validate-modules.ts`.
- [ ] `package.json` contains an npm script `validate:modules` that runs the validator.
- [ ] The repository supports a compatibility alias `validate-modules` (optional but recommended).

Remediation hints:
- If you do not want to add the JS validator, create a short placeholder script that fails with a descriptive message explaining how to implement it.

CHK-005 — Scaffolding template / example module
- [ ] Add a minimal scaffolding template or example module under `specs/001-mcp-module-structure/examples/` or `src/modules/_template/` containing the four subfolders and index files exporting placeholder arrays and a small README.
- [ ] Example exports include `id` fields and a `disabled` flag example.

Remediation hints:
- Copy one existing module and prune content to a minimal example with clear comments.

CHK-006 — Aggregation contracts & tests mapping
- [ ] `spec.md` maps each user story to a test location (e.g., `tests/unit/validator.test.ts`, `tests/integration/mcp-aggregation.test.ts`).
- [ ] At least one integration test is described for aggregation duplicate handling.

Remediation hints:
- Add a short table linking each story to a test file path under a "Testing" subsection.

CHK-007 — Documentation for module authors
- [ ] Add a small `README.md` or `docs/` page describing how to add a module (folders, exports, id conventions, disabled flag).
- [ ] Include expected typings or a short copy-paste example for `prompts/index.ts`.

Remediation hints:
- A single README inside the feature folder is sufficient for the author checklist.

CHK-008 — Acceptance & success criteria clarity
- [ ] Success criteria are precise and measurable. Replace vague thresholds with numbers (e.g., startup time under X seconds with Y modules).
- [ ] Each success criterion maps to a test, benchmark, or measurement plan.

Remediation hints:
- Add simple benchmarks or measurements to the plan (e.g., a tiny script that loads the MCP aggregator with N mocked modules and times it).

CHK-009 — CI and npm scripts (lightweight)
- [ ] Ensure `package.json` includes `validate:modules` and `build` scripts.
- [ ] Add a note to the plan/README describing the required CI steps (validate -> lint -> test -> build).

Remediation hints:
- Don't commit full CI changes yet; a note is fine for the author checklist, but include the intended workflow file path.

CHK-010 — Minimal acceptance smoke test (author-level)
- [ ] Document a simple manual smoke test that an author can run locally:
  - Create a `specs/001-mcp-module-structure/examples/sample-module` with the 4 folders and a single exported item in each index.
  - Run `npm run validate:modules` and expect exit code 0.
  - Run the aggregator test (if implemented) or a simple `node` script that imports `src/mcp` and logs counts.

Remediation hints:
- Provide command snippets in the feature folder README.

---

Notes for the spec author:
- This checklist intentionally omits NFRs and deep strictness to help you unblock implementation quickly.
- After you complete the items above, run the main prerequisite checker again with `--json --require-tasks --include-tasks` to confirm the repo is ready for the implement phase.

If you'd like, I can now:
- Create a minimal `scripts/validate-modules.js` and the `validate:modules` npm script.
- Add an example `sample-module` under `specs/001-mcp-module-structure/examples/` or `src/modules/_template/`.

Tell me which of those you'd like me to do next (I can implement both automatically).