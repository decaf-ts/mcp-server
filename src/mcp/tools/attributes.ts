import { Tool } from "fastmcp";
import path from "path";
import { readTextFile, writeTextFile, fileExists } from "../utils/fs";
import { AttributeSpec, DecoratorSpec } from "./model";

export type AddAttributeArgs = {
  filePath: string;
  className: string;
  attribute: AttributeSpec;
  importsFrom?: string;
};

export type RemoveAttributeArgs = {
  filePath: string;
  className: string;
  attributeName: string;
};

function renderDecorator(d: DecoratorSpec) {
  const args = d.args?.length ? `(${d.args.map((a) => JSON.stringify(a)).join(", ")})` : "()";
  return `@${d.name}${args}`;
}

function ensureImport(source: string, names: string[], from: string) {
  if (!names.length) return source;
  const importRegex = new RegExp(`import \\{([^}]*)\\} from \\\"${from}\\\";`);
  const match = source.match(importRegex);
  if (match) {
    const existing = match[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...existing, ...names])).sort();
    return source.replace(importRegex, `import { ${merged.join(", ")} } from "${from}";`);
  }
  return `import { ${Array.from(new Set(names)).sort().join(", ")} } from "${from}";\n\n` + source;
}

function indent(str: string, spaces = 2) {
  if (!str) return "";
  const pad = " ".repeat(spaces);
  return str
    .split("\n")
    .map((l) => (l ? pad + l : l))
    .join("\n");
}

export const addAttributeTool: Tool<undefined, AddAttributeArgs> = {
  name: "decorator-validation/add-attribute",
  description: "Add a new attribute to a model class and optionally apply validation decorators",
  parameters: {} as any,
  execute: async (args: AddAttributeArgs) => {
    const filePath = path.resolve(args.filePath);
    if (!fileExists(filePath)) throw new Error(`File not found: ${filePath}`);
    let src = readTextFile(filePath)!;

    // ensure imports for decorators
    const importsFrom = args.importsFrom || "@decaf-ts/decorator-validation";
    const names = (args.attribute.decorators || []).map((d) => d.name);
    if (names.length) src = ensureImport(src, names, importsFrom);

    // insert property into class
    const classRegex = new RegExp(`export\\s+class\\s+${args.className}\\s*\\{`);
    if (!classRegex.test(src)) throw new Error(`Class ${args.className} not found in ${filePath}`);
    if (new RegExp(`\\n\\s*(?:@[A-Za-z0-9_]+\\([^)]*\\)\\s*\\n)*\\s*${args.attribute.name}\\??:`).test(src)) {
      return { filePath, updated: false, reason: "attribute already exists" };
    }
    const decorators = (args.attribute.decorators || []).map(renderDecorator).join("\n");
    const optional = args.attribute.optional ? "?" : "";
    const block = `${decorators}${decorators ? "\n" : ""}${args.attribute.name}${optional}: ${args.attribute.type};`;
    src = src.replace(classRegex, (m) => `${m}\n${indent(block)}\n`);

    writeTextFile(filePath, src);
    return { filePath, updated: true };
  },
};

export const removeAttributeTool: Tool<undefined, RemoveAttributeArgs> = {
  name: "decorator-validation/remove-attribute",
  description: "Remove an attribute (and its decorators) from a model class",
  parameters: {} as any,
  execute: async (args: RemoveAttributeArgs) => {
    const filePath = path.resolve(args.filePath);
    if (!fileExists(filePath)) throw new Error(`File not found: ${filePath}`);
    let src = readTextFile(filePath)!;

    const classStart = src.indexOf(`export class ${args.className}`);
    if (classStart < 0) throw new Error(`Class ${args.className} not found in ${filePath}`);
    const classBodyStart = src.indexOf("{", classStart);
    const classBodyEnd = src.indexOf("}\n", classBodyStart);
    const before = src.slice(0, classBodyStart + 1);
    const body = src.slice(classBodyStart + 1, classBodyEnd);
    const after = src.slice(classBodyEnd);

    const propRegex = new RegExp(
      `\\n?\\s*(?:@[A-Za-z0-9_]+\\([^)]*\\)\\s*\\n)*\\s*${args.attributeName}\\??:\\s*[^;]+;\\n?`,
      "g"
    );

    const newBody = body.replace(propRegex, "\n");
    src = before + newBody + after;

    writeTextFile(filePath, src);
    return { filePath, updated: true };
  },
};
