# mcp-server Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-25

## Active Technologies

- TypeScript 5.8.x targeting Node.js ≥22 + FASTMCP 3.20, @decaf-ts shared libs, internal scaffolding utilities (001-mcp-module-structure)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.8.x targeting Node.js ≥22: Follow standard conventions

## Recent Changes

- 001-mcp-module-structure: Added TypeScript 5.8.x targeting Node.js ≥22 + FASTMCP 3.20, @decaf-ts shared libs, internal scaffolding utilities

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->



## Coding Principles

- group similar functionality in folders (analog to namespaces but without any namespace declaration)
- one class per file;
- one interface per file (unless interface is just used as a type);
- group types as other interfaces in a types.ts file per folder;
- group constants or enums in a constants.ts file per folder;
- group decorators in a decorators.ts file per folder;
- always import from the specific file, never from a folder or index file (exceptions for dependencies on other packages);
- prefer the usage of established design patters where applicable:
  - Singleton (can be an anti-pattern. use with care);
  - factory;
  - observer;
  - strategy;
  - builder;
  - etc;
