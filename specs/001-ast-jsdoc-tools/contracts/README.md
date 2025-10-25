# Contracts: AST → JSDoc Tools

This feature exposes CLI contracts (no HTTP APIs). The CLI accepts file or repo inputs and
produces JSON reports. Example command shapes:

- `file` command: accepts `--path` and outputs a `File Report` JSON.
- `repo` command: accepts `--root` and `--src` and outputs a `Repository Run Report` JSON.

Example JSON schema references:
- File Report: see `data-model.md` (File Report section)
- Repository Run Report: see `data-model.md` (Repository Run Report section)

No network endpoints are provided by these tools; integration points are file-system based and CI
scripts that may invoke the CLI.
