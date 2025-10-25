# Function JSDoc Prompt Template

Short instruction:

Generate a concise JSDoc comment for the given function AST object. Include a one-line summary, a short description if needed, @param tags for each parameter (with type and brief description), and an @returns tag when applicable.

Example input (AST-like):

```json
{
  "name": "add",
  "kind": "FunctionDeclaration",
  "signature": "export function add(a: number, b: number): number",
  "exported": true
}
```

Example expected JSDoc output:

```ts
/**
 * Add two numbers and return the sum.
 *
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of a and b.
 */
```

Second example input (AST-like with no types):

```json
{
  "name": "concat",
  "kind": "FunctionDeclaration",
  "signature": "export function concat(a, b)",
  "exported": true
}
```

Second expected output:

```ts
/**
 * Concatenate two values as strings.
 *
 * Note: parameter types could not be determined. Please verify.
 *
 * @param {*} a - First value to concatenate.
 * @param {*} b - Second value to concatenate.
 * @returns {*} The concatenated result.
 */
```
