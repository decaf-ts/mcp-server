# Quickstart: AST → JSDoc Tools (dry-run)

This quickstart shows how to run the tools in dry-run mode against a single file and repository.

1. Install dependencies (from repository root):

```bash
npm install
```

2. Run single-file dry-run (suggestions only):

```bash
# from repo root
node ./tools/ast-jsdoc-tools/bin/cli.js file --path src/index.ts --dry-run --output reports/file-report.json
```

3. Run repository dry-run (uses heuristics for context):

```bash
node ./tools/ast-jsdoc-tools/bin/cli.js repo --root . --src src --dry-run --output reports/repo-report.json
```

4. Apply changes (careful — creates a git-style patch and modifies files):

```bash
node ./tools/ast-jsdoc-tools/bin/cli.js repo --root . --src src --apply --patch-output reports/patch.diff
```

Notes:
- By default the tools run in dry-run and will not modify files.
- Reports are JSON files following the schema in `specs/001-ast-jsdoc-tools/data-model.md`.
