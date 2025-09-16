import { Tool } from "fastmcp";
import path from "path";
import { ensureDir, writeTextFile } from "../utils/fs";

export type ScaffoldSerializerArgs = {
  dir: string; // directory to place serializer class
  name: string; // PascalCase e.g., "YamlSerializer"
  registerDir?: string; // directory to place a registration file calling Serialization.register
  setDefault?: boolean;
};

function serializerTemplate(name: string) {
  return `import { Model } from "@decaf-ts/decorator-validation/src/model/Model";
import { Serializer } from "@decaf-ts/decorator-validation/src/utils/types";

export class ${name}<T extends Model = Model> implements Serializer<T> {
  serialize(model: T): string {
    // TODO: implement
    return JSON.stringify(model);
  }
  deserialize(str: string): T {
    // TODO: implement
    return JSON.parse(str);
  }
}
`;
}

function registrationTemplate(name: string, setDefault?: boolean) {
  const key = name.replace(/Serializer$/, "").toLowerCase();
  return `import { Serialization } from "@decaf-ts/decorator-validation/src/utils/serialization";
import { ${name} } from "./${name}";

// Auto-generated registration
Serialization.register("${key}", ${name} as any, ${setDefault ? "true" : "false"});
`;
}

export const scaffoldSerializerTool: Tool<undefined, ScaffoldSerializerArgs> = {
  name: "decorator-validation/scaffold-serializer",
  description: "Scaffold a new Serializer class and optional registration file",
  parameters: {} as any,
  execute: async (args: ScaffoldSerializerArgs) => {
    const dir = path.resolve(args.dir);
    const file = path.join(dir, `${args.name}.ts`);
    ensureDir(dir);
    writeTextFile(file, serializerTemplate(args.name));

    let registerFile: string | undefined;
    if (args.registerDir) {
      const regDir = path.resolve(args.registerDir);
      ensureDir(regDir);
      registerFile = path.join(regDir, `${args.name}.register.ts`);
      writeTextFile(registerFile, registrationTemplate(args.name, args.setDefault));
    }

    return { classFile: file, registerFile };
  },
};
