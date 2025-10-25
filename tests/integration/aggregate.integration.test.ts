import fs from "fs";
import path from "path";
import os from "os";
import { EnrichCoreWithAggregation } from "../../src/mcp/fastmcp-wiring";

class MockServer {
  prompts: any[] = [];
  tools: any[] = [];
  resources: any[] = [];
  templates: any[] = [];
  addPrompt(p: any) {
    this.prompts.push(p);
  }
  addTool(t: any) {
    this.tools.push(t);
  }
  addResource(r: any) {
    this.resources.push(r);
  }
  addResourceTemplate(t: any) {
    this.templates.push(t);
  }
}

describe("Aggregate integration", () => {
  test("aggregates module assets and reports conflicts", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-int-"));
    const modulesRoot = path.join(tmp, "src", "modules");
    fs.mkdirSync(modulesRoot, { recursive: true });

    // module a
    const a = path.join(modulesRoot, "modA");
    fs.mkdirSync(path.join(a, "prompts"), { recursive: true });
    fs.writeFileSync(
      path.join(a, "prompts", "index.ts"),
      'export const prompts = [{ id: "p1", text: "one" }];\n'
    );
    fs.mkdirSync(path.join(a, "tools"), { recursive: true });
    fs.writeFileSync(
      path.join(a, "tools", "index.ts"),
      'export const tools = [{ id: "t1", name: "tool1" }];\n'
    );

    // module b (duplicate p1)
    const b = path.join(modulesRoot, "modB");
    fs.mkdirSync(path.join(b, "prompts"), { recursive: true });
    fs.writeFileSync(
      path.join(b, "prompts", "index.ts"),
      'export const prompts = [{ id: "p2", text: "two" }, { id: "p1", text: "one-dup" }];\n'
    );
    fs.mkdirSync(path.join(b, "templates"), { recursive: true });
    fs.writeFileSync(
      path.join(b, "templates", "index.ts"),
      'export const templates = [{ id: "tpl1", content: "x" }];\n'
    );

    const server = new MockServer();
    const res = await EnrichCoreWithAggregation(server, tmp);

    // server should have prompts p1 and p2 (one of the duplicates skipped) and tools t1 and template tpl1
    const promptIds = server.prompts.map((p: any) => p.id);
    expect(promptIds).toContain("p1");
    expect(promptIds).toContain("p2");
    expect(server.tools.map((t: any) => t.id)).toContain("t1");
    expect(server.templates.map((t: any) => t.id || t.name)).toContain("tpl1");
    expect(res.conflicts.length).toBeGreaterThanOrEqual(1);

    // cleanup
    fs.rmSync(tmp, { recursive: true, force: true });
  }, 20000);
});
