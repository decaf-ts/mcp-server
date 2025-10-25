# Module Fixtures

These fixtures simulate Decaf MCP modules so validator and integration tests can operate on real directory structures without mutating `src/modules/*`.

```
modules/
  sample-module/
    prompts/
    resources/
    templates/
    tools/
```

Each folder exports typed asset lists that the validator and module registry can import during tests. Add more fixture modules here whenever a scenario requires conflicting IDs, disabled assets, or other edge cases.
