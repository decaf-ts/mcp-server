import { Tool } from "fastmcp";
import path from "path";
import { writeTextFile, ensureDir } from "../utils/fs";

export type ScaffoldValidatorArgs = {
  validatorsDir: string; // directory to place the validator class
  decoratorDir?: string; // optional directory to place a matching decorator function
  name: string; // PascalCase name e.g., "RangeValidator"
  optionsInterface?: string; // optional interface name for options
  category?: "Property Decorators" | "Decorators";
};

function classTemplate(name: string, optionsInterface?: string) {
  const options = optionsInterface || "ValidatorOptions";
  return `import { Validator } from "@decaf-ts/decorator-validation/src/validation/Validators/Validator";
import type { ${options} } from "@decaf-ts/decorator-validation/src/validation/types";

/**
 * @category Validation
 */
export class ${name} extends Validator<${options}> {
  constructor() { super({ key: "${name}", errorMessage: "Validation error" } as any); }

  validate(value: any, options?: ${options}) {
    // TODO: implement validation logic
    return undefined;
  }
}
`;
}

function decoratorTemplate(name: string, category?: string) {
  const func = name.replace(/Validator$/, "");
  return `import { Validation } from "@decaf-ts/decorator-validation/src/validation/Validation";
import { ValidationKeys } from "@decaf-ts/decorator-validation/src/validation/Validators/constants";

/**
 * @category ${category || "Property Decorators"}
 */
export function ${func}(options?: any): PropertyDecorator {
  return function(target: any, propertyKey: string | symbol) {
    const key = Validation.key(ValidationKeys.VALIDATOR);
    const current = Reflect.getMetadata(key, target, propertyKey) || [];
    current.push({ name: "${name}", options });
    Reflect.defineMetadata(key, current, target, propertyKey);
  }
}
`;
}

export const scaffoldValidatorTool: Tool<undefined, ScaffoldValidatorArgs> = {
  name: "decorator-validation/scaffold-validator",
  description: "Scaffold a new Validator subclass and an optional matching decorator function file",
  parameters: {} as any,
  execute: async (args: ScaffoldValidatorArgs) => {
    const validatorsDir = path.resolve(args.validatorsDir);
    const decoratorDir = args.decoratorDir ? path.resolve(args.decoratorDir) : undefined;

    ensureDir(validatorsDir);
    const classFile = path.join(validatorsDir, `${args.name}.ts`);
    writeTextFile(classFile, classTemplate(args.name, args.optionsInterface));

    let decoratorFile: string | undefined;
    if (decoratorDir) {
      ensureDir(decoratorDir);
      const base = args.name.replace(/Validator$/, "");
      decoratorFile = path.join(decoratorDir, `${base}.decorator.ts`);
      writeTextFile(decoratorFile, decoratorTemplate(args.name, args.category));
    }

    return { classFile, decoratorFile };
  },
};
