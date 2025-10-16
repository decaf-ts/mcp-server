import fs from "fs";
import os from "os";
import path from "path";
import { tools } from "../../src/mcp";

function tmpDir(prefix = "mcp-decorator-validation-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function read(file: string) {
  return fs.readFileSync(file, { encoding: "utf-8" });
}

describe("@decaf-ts/mcp-server decorator-validation tools", () => {
  test("create or update model file with properties and class decorators", async () => {
    const dir = tmpDir();
    const file = path.join(dir, "User.ts");

    await tools.createOrUpdateModelTool.execute({
      filePath: file,
      className: "User",
      classDecorators: [ { name: "hashedBy", args: ["default"] } ],
      properties: [
        { name: "name", type: "string", decorators: [ { name: "required" }, { name: "minlength", args: [2] } ] },
        { name: "age", type: "number", decorators: [ { name: "min", args: [18] } ] },
      ],
      importsFrom: "@decaf-ts/decorator-validation",
      overwrite: true,
    } as any);

    const content = read(file);
    expect(content).toContain("export class User");
    expect(content).toContain("@model()");
    expect(content).toContain("@hashedBy(\"default\")");
    expect(content).toContain("name: string;");
    expect(content).toContain("@required()");
    expect(content).toContain("@minlength(2)");
  });

  test("fails when overwrite is disabled and file exists", async () => {
    const dir = tmpDir();
    const file = path.join(dir, "Existing.ts");
    fs.writeFileSync(file, "export class Existing {}\n");

    await expect(
      tools.createOrUpdateModelTool.execute({
        filePath: file,
        className: "Existing",
        properties: [],
        importsFrom: "@decaf-ts/decorator-validation",
      } as any)
    ).rejects.toThrow(/File already exists/);
  });

  test("add and remove attribute", async () => {
    const dir = tmpDir();
    const file = path.join(dir, "Order.ts");
    fs.writeFileSync(file, `import { model } from "@decaf-ts/decorator-validation";
@model()
export class Order {
}
`);

    await tools.addAttributeTool.execute({
      filePath: file,
      className: "Order",
      attribute: { name: "total", type: "number", decorators: [ { name: "min", args: [0] } ] },
      importsFrom: "@decaf-ts/decorator-validation",
    } as any);

    let content = read(file);
    expect(content).toContain("total: number;");
    expect(content).toContain("@min(0)");

    await tools.removeAttributeTool.execute({ filePath: file, className: "Order", attributeName: "total" } as any);

    content = read(file);
    expect(content).not.toContain("total: number;");
  });

  test("add attribute ignores duplicates and errors on missing files", async () => {
    const dir = tmpDir();
    const file = path.join(dir, "Invoice.ts");
    fs.writeFileSync(file, `import { model } from "@decaf-ts/decorator-validation";
@model()
export class Invoice {
}
`);

    await tools.addAttributeTool.execute({
      filePath: file,
      className: "Invoice",
      attribute: { name: "id", type: "string", decorators: [ { name: "pattern", args: ["ID-"] } ] },
      importsFrom: "@decaf-ts/decorator-validation",
    } as any);

    await tools.addAttributeTool.execute({
      filePath: file,
      className: "Invoice",
      attribute: { name: "id", type: "string", decorators: [] },
      importsFrom: "@decaf-ts/decorator-validation",
    } as any);

    const missing = path.join(dir, "Missing.ts");
    await expect(
      tools.addAttributeTool.execute({
        filePath: missing,
        className: "Void",
        attribute: { name: "value", type: "number" },
        importsFrom: "@decaf-ts/decorator-validation",
      } as any)
    ).rejects.toThrow(/Model file not found/);
  });

  test("apply and remove decorators", async () => {
    const dir = tmpDir();
    const file = path.join(dir, "Product.ts");
    fs.writeFileSync(file, `import { model } from "@decaf-ts/decorator-validation";
@model()
export class Product {
  sku: string;
}
`);

    await tools.applyDecoratorTool.execute({
      filePath: file,
      className: "Product",
      target: { kind: "class" },
      decorator: { name: "serializedBy", args: ["json"] },
      importsFrom: "@decaf-ts/decorator-validation",
    } as any);

    await tools.applyDecoratorTool.execute({
      filePath: file,
      className: "Product",
      target: { kind: "property", name: "sku" },
      decorator: { name: "pattern", args: ["[A-Z0-9]+-"] },
      importsFrom: "@decaf-ts/decorator-validation",
    } as any);

    let content = read(file);
    expect(content).toContain("@serializedBy(\"json\")");
    expect(content).toContain("@pattern(\"[A-Z0-9]+-\")");

    await tools.removeDecoratorTool.execute({
      filePath: file,
      className: "Product",
      target: { kind: "class" },
      decoratorName: "serializedBy",
    } as any);

    content = read(file);
    expect(content).not.toContain("@serializedBy(\"json\")");

    await tools.removeDecoratorTool.execute({
      filePath: file,
      className: "Product",
      target: { kind: "property", name: "sku" },
      decoratorName: "pattern",
    } as any);

    content = read(file);
    expect(content).not.toContain("@pattern");

    const missing = path.join(dir, "MissingProduct.ts");
    await expect(
      tools.applyDecoratorTool.execute({
        filePath: missing,
        className: "Missing",
        target: { kind: "class" },
        decorator: { name: "model" },
        importsFrom: "@decaf-ts/decorator-validation",
      } as any)
    ).rejects.toThrow(/Model file not found/);
  });

  test("scaffold validator, serializer and hashing", async () => {
    const dir = tmpDir();

    const v = await tools.scaffoldValidatorTool.execute({
      validatorsDir: dir,
      decoratorDir: dir,
      name: "RangeValidator",
    } as any);
    expect(fs.existsSync(v.classFile)).toBe(true);
    if (v.decoratorFile) expect(fs.existsSync(v.decoratorFile)).toBe(true);

    const s = await tools.scaffoldSerializerTool.execute({
      dir,
      name: "YamlSerializer",
      registerDir: dir,
      setDefault: false,
    } as any);
    expect(fs.existsSync(s.classFile)).toBe(true);
    if (s.registerFile) expect(fs.existsSync(s.registerFile)).toBe(true);

    const h = await tools.scaffoldHashingTool.execute({
      dir,
      name: "sha256",
      registerDir: dir,
      setDefault: true,
    } as any);
    expect(fs.existsSync(h.functionFile)).toBe(true);
    if (h.registerFile) expect(fs.existsSync(h.registerFile)).toBe(true);
  });
});
