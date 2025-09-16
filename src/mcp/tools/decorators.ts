import { Tool } from "fastmcp";
import path from "path";
import { readTextFile, writeTextFile, fileExists } from "../utils/fs";

export type ApplyDecoratorArgs = {
  filePath: string;
  className: string;
  target: { kind: "class" } | { kind: "property"; name: string };
  decorator: { name: string; args?: any[] };
  importsFrom?: string;
};

export type RemoveDecoratorArgs = {
  filePath: string;
  className: string;
  target: { kind: "class" } | { kind: "property"; name: string };
  decoratorName: string;
};

function renderDecorator(name: string, args?: any[]) {
  const params = args?.length ? `(${args.map((a) => JSON.stringify(a)).join(", ")})` : "()";
  return `@${name}${params}`;
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

export const applyDecoratorTool: Tool<undefined, ApplyDecoratorArgs> = {
  name: "decorator-validation/apply-decorator",
  description: "Apply a categorized decorator to a class or property in a model file",
  parameters: {} as any,
  execute: async (args: ApplyDecoratorArgs) => {
    const filePath = path.resolve(args.filePath);
    if (!fileExists(filePath)) throw new Error(`File not found: ${filePath}`);
    let src = readTextFile(filePath)!;

    const importsFrom = args.importsFrom || "@decaf-ts/decorator-validation";
    src = ensureImport(src, [args.decorator.name], importsFrom);

    if (args.target.kind === "class") {
      const classRegex = new RegExp(`export\\s+class\\s+${args.className}\\s*\\{`);
      const lines = src.split("\n");
      const idx = lines.findIndex((l) => classRegex.test(l));
      if (idx < 0) throw new Error(`Class ${args.className} not found`);
      const decLine = renderDecorator(args.decorator.name, args.decorator.args);
      if (!lines[idx - 1]?.includes(`@${args.decorator.name}`)) {
        lines.splice(idx, 0, decLine);
      }
      src = lines.join("\n");
    } else {
      // property
      const propRegex = new RegExp(`(\\n\\s*)(?:@[A-Za-z0-9_]+\\([^)]*\\)\\s*\\n)*(\\s*)(${args.target.name}\\??:\\s*[^;]+;)`);
      src = src.replace(propRegex, (m, g1, g2, g3) => {
        const dec = renderDecorator(args.decorator.name, args.decorator.args);
        return `${g1}${dec}\n${g1}${g3}`;
      });
    }

    writeTextFile(filePath, src);
    return { filePath, updated: true };
  },
};

export const removeDecoratorTool: Tool<undefined, RemoveDecoratorArgs> = {
  name: "decorator-validation/remove-decorator",
  description: "Remove a categorized decorator from a class or property in a model file",
  parameters: {} as any,
  execute: async (args: RemoveDecoratorArgs) => {
    const filePath = path.resolve(args.filePath);
    if (!fileExists(filePath)) throw new Error(`File not found: ${filePath}`);
    let src = readTextFile(filePath)!;

    if (args.target.kind === "class") {
      const classRegex = new RegExp(`export\\s+class\\s+${args.className}\\s*\\{`);
      const lines = src.split("\n");
      const idx = lines.findIndex((l) => classRegex.test(l));
      if (idx < 0) throw new Error(`Class ${args.className} not found`);
      if (lines[idx - 1]?.includes(`@${args.decoratorName}`)) {
        lines.splice(idx - 1, 1);
      }
      src = lines.join("\n");
    } else {
      const reg = new RegExp(`\\n\\s*@${args.decoratorName}\\([^)]*\\)\\s*`);
      src = src.replace(reg, "\n");
    }

    writeTextFile(filePath, src);
    return { filePath, updated: true };
  },
};
