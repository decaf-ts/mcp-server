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

function writeIndex(folder: string, exportName: string, items: any[]) {
  fs.mkdirSync(folder, { recursive: true });
  const content = `export const ${exportName} = ${JSON.stringify(items, null, 2)};\n`;
  fs.writeFileSync(path.join(folder, "index.ts"), content);
}

describe("EnrichCoreWithAggregation", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-wiring-"));

  afterAll(() => {
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch (e) {}
  });

  test("registers aggregated assets on provided server", async () => {
    const mod1 = path.join(tmp, "src", "modules", "mod1");
    writeIndex(path.join(mod1, "prompts"), "promptList", [
      { id: "p1", text: "one" },
    ]);
    writeIndex(path.join(mod1, "tools"), "toolList", [{ id: "t1" }]);

    const server = new MockServer();
    const res = await EnrichCoreWithAggregation(server as any, tmp);

    expect(server.prompts.length).toBeGreaterThanOrEqual(1);
    expect(server.tools.length).toBeGreaterThanOrEqual(1);
    expect(res.conflicts).toBeDefined();
  });
});
