# Module Structure for Decaf MCP

This document describes the canonical structure for modules under `src/modules` and how the MCP server consumes them.

Required layout for each module (e.g. `src/modules/my-module`):

- prompts/
  - `index.ts` exporting a typed `promptList` array
- resources/
  - `index.ts` exporting a typed `resources` array
- templates/
  - `index.ts` exporting a typed `templates` array
- tools/
  - `index.ts` exporting a typed `toolList` array

Each exported item should include a canonical identifier (prefer `id` or `name`) so the aggregator can deterministically deduplicate items. Example:

```ts
export const promptList = [
  {
    id: 'my-prompt',
    title: 'Describe a change',
    description: 'A prompt for documenting code changes',
    content: '...'
  },
];
```

Validation & automation

- Run `npm run validate-modules` to validate all modules. This is executed automatically by `npm run lint`.
- Run `npm run check-aggregation` to check for aggregation conflicts; it exits non-zero when duplicates are found.
- Use `npm run scaffold-module <name>` to create a new module scaffold with placeholder index.ts files.

Provenance

Each aggregated item includes a `provenance` field added at runtime by the aggregator:

```json
{ "moduleName": "my-module", "modulePath": "/path/to/repo/src/modules/my-module" }
```

Operational notes

- The aggregator dynamically imports index files; in production builds you may prefer to precompile manifests to avoid runtime imports.
- The validator is intentionally conservative: it fails on missing folders and missing index exports. If a module must be temporarily disabled, add a `disabled` flag in its index export (validator currently sees missing/empty exports as failures).

