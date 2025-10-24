import fs from "fs";
import os from "os";
import path from "path";
import { FastMCP } from "fastmcp";
import { McpWrapper } from "../../src/McpWrapper";

describe("McpWrapper", () => {
  let workspace: string;
  let moduleFile: string;

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-wrapper-"));
    moduleFile = path.join(workspace, "mcp-module.cjs");
    const moduleSource = `module.exports = {
  PACKAGE_NAME: "@test/example",
  VERSION: "0.0.1",
  enrich(server) {
    server.addPrompt?.({
      name: "demo",
      description: "Demo prompt",
      load: async () => "demo",
    });
    return server;
  }
};
`;
    fs.writeFileSync(moduleFile, moduleSource, "utf8");
  });

  afterEach(() => {
    if (fs.existsSync(workspace)) {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  });

  test("crawl discovers MCP modules and load returns metadata", async () => {
    const wrapper = new McpWrapper(workspace, 1);
    const discovered = (wrapper as unknown as {
      crawl(base: string, levels: number): string[];
    }).crawl(workspace, 1);
    expect(discovered).toContain(moduleFile);

    const empty = (wrapper as unknown as {
      crawl(base: string, levels: number): string[];
    }).crawl(workspace, 0);
    expect(empty).toEqual([]);

    const mcp = (wrapper as unknown as { mcp: FastMCP }).mcp;
    expect(mcp).toBeInstanceOf(FastMCP);

    const { package: pkg, version } = await (wrapper as unknown as {
      load(server: FastMCP, file: string): Promise<{
        mcp: FastMCP;
        package: string;
        version: string;
      }>;
    }).load(mcp, moduleFile);

    expect(pkg).toBe("@test/example");
    expect(version).toBe("0.0.1");
  });

  test("boot loads modules from global modules list", async () => {
    const wrapper = new McpWrapper(workspace, 1);
    const previous = (global as unknown as { modules?: string[] }).modules;
    (global as unknown as { modules: string[] }).modules = [
      "@decaf-ts/mcp-ignore",
      moduleFile,
    ];
    const server = await (wrapper as unknown as { boot(): Promise<FastMCP> }).boot();
    expect(server).toBeInstanceOf(FastMCP);
    (global as unknown as { modules?: string[] }).modules = previous;
  });

  test("load rethrows module loading errors", async () => {
    const wrapper = new McpWrapper(workspace, 1);
    const mcp = (wrapper as unknown as { mcp: FastMCP }).mcp;
    await expect(
      (wrapper as unknown as {
        load(server: FastMCP, file: string): Promise<unknown>;
      }).load(mcp, path.join(workspace, "missing.cjs"))
    ).rejects.toThrow(/Cannot find module/);
  });
});
