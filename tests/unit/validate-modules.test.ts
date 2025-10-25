import fs from "fs";
import path from "path";
import os from "os";
import { validateModules } from "../../src/mcp/validation";

function makeTempModule(root: string, name: string, folders: string[]) {
  const modulePath = path.join(root, "src", "modules", name);
  fs.mkdirSync(modulePath, { recursive: true });
  for (const f of folders) {
    const sub = path.join(modulePath, f);
    fs.mkdirSync(sub, { recursive: true });
    const idx = path.join(sub, "index.ts");
    fs.writeFileSync(idx, "export const items = [] as const;\n");
  }
  return modulePath;
}

describe("validateModules", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));

  afterAll(() => {
    // remove tmp directory
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch (e) {}
  });

  test("passes when module has all required folders with index exports", () => {
    makeTempModule(tmp, "good-module", [
      "prompts",
      "resources",
      "templates",
      "tools",
    ]);
    const report = validateModules(tmp);
    expect(report.ok).toBe(true);
    expect(report.modulesChecked).toBe(1);
    expect(report.issues.length).toBe(0);
  });

  test("reports missing folder and missing export", () => {
    // create a module missing 'tools' and with resources missing index
    const modulePath = path.join(tmp, "src", "modules", "bad-module");
    fs.mkdirSync(path.join(modulePath, "prompts"), { recursive: true });
    fs.mkdirSync(path.join(modulePath, "resources"), { recursive: true });
    // create resources/index without export
    fs.writeFileSync(
      path.join(modulePath, "resources", "index.ts"),
      "// empty\n"
    );
    // no templates, no tools

    const report = validateModules(tmp);
    expect(report.ok).toBe(false);
    expect(report.modulesChecked).toBe(2);
    // should include at least one missing-folder and one empty-list/missing-export
    const types = report.issues.map((i) => i.type);
    expect(types).toEqual(
      expect.arrayContaining(["missing-folder", "empty-list"])
    );
  });
});
