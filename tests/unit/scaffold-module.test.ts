import fs from "fs";
import path from "path";
import os from "os";
import { scaffoldModule } from "../../src/mcp/validation/scaffoldModule";

describe("scaffoldModule", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-scaffold-"));
  const moduleName = "scaffold-test-module";
  afterAll(() => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch (e) {}
  });

  test("creates all required folders and index.ts files", () => {
    const res = scaffoldModule(tmp, moduleName);
    expect(res.modulePath).toBe(path.join(tmp, "src", "modules", moduleName));
    const expected = ["prompts", "resources", "templates", "tools"].map((s) =>
      path.join(res.modulePath, s, "index.ts")
    );
    for (const p of expected) {
      expect(fs.existsSync(p)).toBe(true);
      const content = fs.readFileSync(p, "utf8");
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
