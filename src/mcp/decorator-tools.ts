import fs from "fs";
import path from "path";

export type DecoratorSpec = {
  name: string;
  args?: unknown[];
};

export type AttributeSpec = {
  name: string;
  type: string;
  decorators?: DecoratorSpec[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDecorator(spec: DecoratorSpec): string {
  const args = (spec.args || []).map((arg) => JSON.stringify(arg)).join(", ");
  return `@${spec.name}(${args})`;
}

function ensureDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function collectDecoratorNames(
  classDecorators: DecoratorSpec[] | undefined,
  properties: AttributeSpec[] | undefined
) {
  const names = new Set<string>();
  names.add("model");
  for (const decorator of classDecorators || []) {
    names.add(decorator.name);
  }
  for (const property of properties || []) {
    for (const decorator of property.decorators || []) {
      names.add(decorator.name);
    }
  }
  return names;
}

function ensureImport(
  content: string,
  importsFrom: string,
  decorators: Set<string>
) {
  /* istanbul ignore next */
  if (!decorators.size) return content;
  const importRegex = new RegExp(
    `import\\s+\\{([^}]+)\\}\\s+from\\s+["']${escapeRegExp(importsFrom)}["'];`
  );
  const match = content.match(importRegex);
  const sorted = Array.from(decorators).sort();

  if (match) {
    const existing = match[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...existing, ...sorted])).sort();
    return content.replace(
      importRegex,
      `import { ${merged.join(", ")} } from "${importsFrom}";`
    );
  }

  const importLine = `import { ${sorted.join(", ")} } from "${importsFrom}";`;
  return `${importLine}\n\n${content}`;
}

function addPropertyBlock(property: AttributeSpec) {
  const decorators = (property.decorators || [])
    .map(formatDecorator)
    .join("\n  ");
  const decoratorBlock = decorators ? `  ${decorators}\n` : "";
  return `${decoratorBlock}  ${property.name}: ${property.type};`;
}

function removePropertyBlock(content: string, propertyName: string) {
  const lines = content.split(/\r?\n/);
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.trim().startsWith(`@`) &&
      lines[i + 1]?.includes(`${propertyName}:`)
    ) {
      continue;
    }
    if (line.includes(`${propertyName}:`)) {
      // skip this line and any trailing blank line
      continue;
    }
    result.push(line);
  }
  return result.join("\n");
}

function insertDecorator(
  content: string,
  decorator: DecoratorSpec,
  target: {
    kind: "class" | "property";
    name?: string;
  }
) {
  const decoratorLine = formatDecorator(decorator);
  if (target.kind === "class") {
    const classRegex = /(export\s+class\s+[^\s{]+\s*\{)/;
    if (content.includes(decoratorLine)) return content;
    return content.replace(classRegex, `${decoratorLine}\n$1`);
  }
  if (!target.name) return content;
  const propertyRegex = new RegExp(
    `(^\\s*)(?:@.*\\n\\1)*${escapeRegExp(target.name)}:`,
    "m"
  );
  const match = propertyRegex.exec(content);
  if (!match) return content;
  const indent = match[1] || "  ";
  if (content.includes(`${indent}${decoratorLine}`)) return content;
  return (
    content.slice(0, match.index) +
    `${indent}${decoratorLine}\n` +
    content.slice(match.index)
  );
}

function removeDecorator(
  content: string,
  decoratorName: string,
  target: {
    kind: "class" | "property";
    name?: string;
  }
) {
  const decoratorRegex = new RegExp(
    `^\\s*@${escapeRegExp(decoratorName)}\\([^)]*\\)`,
    "m"
  );
  if (target.kind === "class") {
    return content.replace(decoratorRegex, "");
  }
  if (target.name) {
    const pattern = new RegExp(
      `(^\\s*@${escapeRegExp(decoratorName)}\\([^)]*\\)\\s*$\\n)(?=\\s*${escapeRegExp(target.name)}:)`,
      "m"
    );
    return content.replace(pattern, "");
  }
  return content;
}

function writeIfChanged(filePath: string, content: string) {
  ensureDirectory(filePath);
  fs.writeFileSync(filePath, content);
}

export const decoratorTools = {
  createOrUpdateModelTool: {
    name: "create-or-update-model",
    description: "Create or update a validation-ready model class",
    execute: async (args: {
      filePath: string;
      className: string;
      classDecorators?: DecoratorSpec[];
      properties: AttributeSpec[];
      importsFrom: string;
      overwrite?: boolean;
    }) => {
      if (!args.overwrite && fs.existsSync(args.filePath)) {
        throw new Error(`File already exists at ${args.filePath}`);
      }
      const decorators = collectDecoratorNames(
        args.classDecorators,
        args.properties
      );
      let content = `@model()`;
      for (const decorator of args.classDecorators || []) {
        content += `\n${formatDecorator(decorator)}`;
      }
      const properties = (args.properties || [])
        .map(addPropertyBlock)
        .join("\n\n");
      content += `\nexport class ${args.className} {\n${properties ? `${properties}\n` : ""}}\n`;
      content = ensureImport(content, args.importsFrom, decorators);
      writeIfChanged(args.filePath, content);
      return { filePath: args.filePath };
    },
  },
  addAttributeTool: {
    name: "add-attribute",
    description: "Add a decorated attribute to an existing model",
    execute: async (args: {
      filePath: string;
      className: string;
      attribute: AttributeSpec;
      importsFrom: string;
    }) => {
      if (!fs.existsSync(args.filePath)) {
        throw new Error(`Model file not found at ${args.filePath}`);
      }
      let content = fs.readFileSync(args.filePath, "utf8");
      if (content.includes(`${args.attribute.name}:`)) {
        return { filePath: args.filePath };
      }
      const decorators = collectDecoratorNames(undefined, [args.attribute]);
      content = ensureImport(content, args.importsFrom, decorators);
      const insertionPoint = content.lastIndexOf("}");
      const block = addPropertyBlock(args.attribute);
      const before = content.slice(0, insertionPoint).replace(/\s*$/, "");
      const after = content.slice(insertionPoint);
      const updated = `${before}\n${block}\n${after}`;
      writeIfChanged(args.filePath, updated);
      return { filePath: args.filePath };
    },
  },
  removeAttributeTool: {
    name: "remove-attribute",
    description: "Remove an attribute from a model class",
    execute: async (args: {
      filePath: string;
      className: string;
      attributeName: string;
    }) => {
      if (!fs.existsSync(args.filePath)) return { filePath: args.filePath };
      const content = fs.readFileSync(args.filePath, "utf8");
      const updated = removePropertyBlock(content, args.attributeName);
      writeIfChanged(args.filePath, updated);
      return { filePath: args.filePath };
    },
  },
  applyDecoratorTool: {
    name: "apply-decorator",
    description: "Apply a decorator to a class or property",
    execute: async (args: {
      filePath: string;
      className: string;
      target: { kind: "class" | "property"; name?: string };
      decorator: DecoratorSpec;
      importsFrom: string;
    }) => {
      if (!fs.existsSync(args.filePath)) {
        throw new Error(`Model file not found at ${args.filePath}`);
      }
      let content = fs.readFileSync(args.filePath, "utf8");
      const decorators = new Set<string>([args.decorator.name]);
      content = ensureImport(content, args.importsFrom, decorators);
      content = insertDecorator(content, args.decorator, args.target);
      writeIfChanged(args.filePath, content);
      return { filePath: args.filePath };
    },
  },
  removeDecoratorTool: {
    name: "remove-decorator",
    description: "Remove a decorator from a class or property",
    execute: async (args: {
      filePath: string;
      className: string;
      target: { kind: "class" | "property"; name?: string };
      decoratorName: string;
    }) => {
      if (!fs.existsSync(args.filePath)) return { filePath: args.filePath };
      let content = fs.readFileSync(args.filePath, "utf8");
      content = removeDecorator(content, args.decoratorName, args.target);
      writeIfChanged(args.filePath, content);
      return { filePath: args.filePath };
    },
  },
  scaffoldValidatorTool: {
    name: "scaffold-validator",
    description: "Scaffold a validator class and optional decorator",
    execute: async (args: {
      validatorsDir: string;
      decoratorDir?: string;
      name: string;
    }) => {
      const classFile = path.join(args.validatorsDir, `${args.name}.ts`);
      ensureDirectory(classFile);
      const classContent = `export class ${args.name} {\n  validate(value: unknown): boolean {\n    return value !== undefined;\n  }\n}\n`;
      fs.writeFileSync(classFile, classContent);
      let decoratorFile: string | undefined;
      if (args.decoratorDir) {
        decoratorFile = path.join(
          args.decoratorDir,
          `${args.name}Decorator.ts`
        );
        ensureDirectory(decoratorFile);
        fs.writeFileSync(
          decoratorFile,
          `export function ${args.name}Decorator() {\n  return () => void 0;\n}\n`
        );
      }
      return { classFile, decoratorFile };
    },
  },
  scaffoldSerializerTool: {
    name: "scaffold-serializer",
    description: "Scaffold a serializer class and optional registry",
    execute: async (args: {
      dir: string;
      name: string;
      registerDir?: string;
      setDefault?: boolean;
    }) => {
      const classFile = path.join(args.dir, `${args.name}.ts`);
      ensureDirectory(classFile);
      fs.writeFileSync(
        classFile,
        `export class ${args.name} {\n  serialize(value: unknown): string {\n    return JSON.stringify(value);\n  }\n}\n`
      );
      let registerFile: string | undefined;
      if (args.registerDir) {
        registerFile = path.join(args.registerDir, `${args.name}Register.ts`);
        ensureDirectory(registerFile);
        fs.writeFileSync(
          registerFile,
          `export function register${args.name}() {\n  return ${args.setDefault ? "'default'" : "'optional'"};\n}\n`
        );
      }
      return { classFile, registerFile };
    },
  },
  scaffoldHashingTool: {
    name: "scaffold-hashing",
    description: "Scaffold a hashing function and optional registry",
    execute: async (args: {
      dir: string;
      name: string;
      registerDir?: string;
      setDefault?: boolean;
    }) => {
      const functionFile = path.join(args.dir, `${args.name}.ts`);
      ensureDirectory(functionFile);
      fs.writeFileSync(
        functionFile,
        `export function ${args.name}(value: string): string {\n  return value.split('').reverse().join('');\n}\n`
      );
      let registerFile: string | undefined;
      if (args.registerDir) {
        registerFile = path.join(args.registerDir, `${args.name}Register.ts`);
        ensureDirectory(registerFile);
        fs.writeFileSync(
          registerFile,
          `export function register${args.name}() {\n  return ${args.setDefault ? "'default'" : "'optional'"};\n}\n`
        );
      }
      return { functionFile, registerFile };
    },
  },
} as const;

export type DecoratorTools = typeof decoratorTools;
