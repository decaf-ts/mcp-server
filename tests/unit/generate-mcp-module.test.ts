import * as path from "path";
import fs from "fs";
import os from "os";
import { FastMCP } from "fastmcp";
import generate from "../../src/mcp/tools/generateMcpModule";

function mkServer() {
  return new FastMCP({
    name: "test",
    instructions: "",
    version: "0.0.0" as any,
  });
}

describe("generate-mcp-module tool", () => {
  test("creates a module for ./decoration and writes prompts/resources/templates/tools", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-gen-"));
    const cwd = process.cwd();
    try {
      process.chdir(tmp);
      // copy the decoration repo into tmp for isolation
      let src = path.join(cwd, "decoration");
      if (!fs.existsSync(src)) {
        // fallback to embedded module source
        src = path.join(cwd, "src", "modules", "decoration");
      }
      const dest = path.join(tmp, "decoration");
      // copy recursively
      const cp = (s: string, d: string) => {
        if (!fs.existsSync(s)) throw new Error(`source missing ${s}`);
        const st = fs.statSync(s);
        if (st.isDirectory()) {
          fs.mkdirSync(d, { recursive: true });
          for (const e of fs.readdirSync(s))
            cp(path.join(s, e), path.join(d, e));
        } else {
          fs.copyFileSync(s, d);
        }
      };
      cp(src, dest);

      const tool =
        generate.generateMcpModuleTool || generate.default || generate;
      const res: any = await tool.execute({ repoPath: "./decoration" });
      const out = JSON.parse(res.content[0].text);
      const moduleRoot = out.moduleRoot;
      expect(fs.existsSync(path.join(moduleRoot, "prompts"))).toBe(true);
      expect(fs.existsSync(path.join(moduleRoot, "resources"))).toBe(true);
      expect(fs.existsSync(path.join(moduleRoot, "templates"))).toBe(true);
      expect(fs.existsSync(path.join(moduleRoot, "tools"))).toBe(true);
      // prompts index should exist
      expect(fs.existsSync(path.join(moduleRoot, "prompts", "index.ts"))).toBe(
        true
      );

      // module index should exist
      expect(fs.existsSync(path.join(moduleRoot, "index.ts"))).toBe(true);
    } finally {
      process.chdir(cwd);
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch (e) {}
    }
  }, 20000);
});
