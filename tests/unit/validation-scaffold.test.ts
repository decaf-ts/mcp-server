import fs from "fs";
import path from "path";
import os from "os";
import {
  validateModuleScaffolding,
  assertModuleScaffolding,
} from "../../src/utils/moduleValidator";

function makeTempWorkspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));
  const modulesRoot = path.join(tmp, "src", "modules");
  fs.mkdirSync(modulesRoot, { recursive: true });
  return { tmp, modulesRoot };
}

function createModule(base: string, name: string, createAll = true) {
  const modRoot = path.join(base, name);
  fs.mkdirSync(modRoot, { recursive: true });
  const folders = ["prompts", "resources", "templates", "tools"];
  for (const f of folders) {
    const fp = path.join(modRoot, f);
    if (createAll || f !== "templates") {
      fs.mkdirSync(fp, { recursive: true });
      const indexPath = path.join(fp, "index.ts");
      fs.writeFileSync(
        indexPath,
        `export const items = [] as const;\n`,
        "utf8"
      );
    }
  }
  return modRoot;
}

describe("moduleValidator", () => {
  test("passes for a valid module scaffold", () => {
    const { tmp, modulesRoot } = makeTempWorkspace();
    try {
      createModule(modulesRoot, "sample-valid", true);
      const result = validateModuleScaffolding(tmp);
      expect(result.hasErrors).toBe(false);
      // no error issues
      expect(result.issues.filter((i) => i.severity === "error").length).toBe(
        0
      );
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("detects missing folder and missing index export", () => {
    const { tmp, modulesRoot } = makeTempWorkspace();
    try {
      createModule(modulesRoot, "sample-bad", false); // omit templates folder
      const result = validateModuleScaffolding(tmp);
      expect(result.hasErrors).toBe(true);
      const missingFolder = result.issues.find(
        (i) => i.type === "missing-folder"
      );
      expect(missingFolder).toBeDefined();
      const missingExport = result.issues.find(
        (i) => i.type === "missing-export"
      );
      expect(missingExport).toBeDefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("assertModuleScaffolding throws on error", () => {
    const { tmp, modulesRoot } = makeTempWorkspace();
    try {
      // create one valid and one invalid
      createModule(modulesRoot, "one-valid", true);
      createModule(modulesRoot, "one-bad", false);
      expect(() => assertModuleScaffolding(tmp)).toThrow();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
