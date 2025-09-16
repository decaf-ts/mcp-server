import { Tool } from "fastmcp";
import path from "path";
import { ensureDir, writeTextFile } from "../utils/fs";

export type ScaffoldHashingArgs = {
  dir: string; // directory to place hashing function file
  name: string; // kebab or snake or simple, e.g., "sha256"
  functionBody?: string; // optional JS body that returns a string hash
  registerDir?: string; // directory to place a registration file calling Hashing.register
  setDefault?: boolean;
};

function hashingTemplate(funcName: string, body?: string) {
  return `// Auto-generated hashing function
export function ${funcName}(obj: any): string {
  ${body || "return JSON.stringify(obj).length.toString();"}
}
`;
}

function registrationTemplate(funcName: string, key: string, setDefault?: boolean) {
  return `import { Hashing } from "@decaf-ts/decorator-validation/src/utils/hashing";
import { ${funcName} } from "./${funcName}";

// Auto-generated registration
Hashing.register("${key}", ${funcName} as any, ${setDefault ? "true" : "false"});
`;
}

export const scaffoldHashingTool: Tool<undefined, ScaffoldHashingArgs> = {
  name: "decorator-validation/scaffold-hashing",
  description: "Scaffold a new hashing function and optional registration file",
  parameters: {} as any,
  execute: async (args: ScaffoldHashingArgs) => {
    const dir = path.resolve(args.dir);
    ensureDir(dir);
    const funcName = args.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const file = path.join(dir, `${funcName}.ts`);
    writeTextFile(file, hashingTemplate(funcName, args.functionBody));

    let registerFile: string | undefined;
    if (args.registerDir) {
      const regDir = path.resolve(args.registerDir);
      ensureDir(regDir);
      registerFile = path.join(regDir, `${funcName}.register.ts`);
      writeTextFile(registerFile, registrationTemplate(funcName, args.name, args.setDefault));
    }

    return { functionFile: file, registerFile };
  },
};
