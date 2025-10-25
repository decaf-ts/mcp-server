import fs from "fs";
import path from "path";
import os from "os";
import { aggregateModules } from "../../src/mcp/aggregateModules";

function writeIndex(folder: string, exportName: string, items: any[]) {
  fs.mkdirSync(folder, { recursive: true });
  const content = `export const ${exportName} = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(path.join(folder, "index.ts"), content);
}

describe("aggregateModules", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-agg-"));

  afterAll(() => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch (e) {}
  });

  test("aggregates items from multiple modules and detects duplicates", async () => {
    const mod1 = path.join(tmp, "src", "modules", "mod1");
    writeIndex(path.join(mod1, "prompts"), "promptList", [
      { id: "p1", text: "one" },
    ]);
    writeIndex(path.join(mod1, "tools"), "toolList", [
      { id: "t1", name: "tool1" },
    ]);

    const mod2 = path.join(tmp, "src", "modules", "mod2");
    writeIndex(path.join(mod2, "prompts"), "promptList", [
      { id: "p2", text: "two" },
      { id: "p1", text: "one-dup" },
    ]);
    writeIndex(path.join(mod2, "templates"), "templateList", [
      { name: "template1" },
    ]);

    const res = await aggregateModules(tmp);
    // prompts should contain p1 and p2, but p1 from mod2 is duplicate and should be skipped
    const promptIds = res.prompts.map((p: any) => p.id);
    expect(promptIds).toContain("p1");
    expect(promptIds).toContain("p2");
    expect(res.conflicts.length).toBeGreaterThanOrEqual(1);
    // tools should include t1
    expect(res.tools.map((t: any) => t.id)).toContain("t1");
    // templates should include template1
    expect(res.templates.map((t: any) => t.name)).toContain("template1");
  });
});
