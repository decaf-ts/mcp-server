import * as path from "path";
import { FastMCP } from "fastmcp";
import enrich from "../../src/modules/mcp/decoration-assist";

function mkServer() {
  return new FastMCP({
    name: "test",
    instructions: "",
    version: "0.0.0" as any,
  });
}

function getTool(server: FastMCP, name: string) {
  // FastMCP stores tools on server.tools map; use any to access
  const s: any = server as any;
  const tool =
    s.tools?.find((t: any) => t.name === name) || s.tools?.get?.(name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe("decoration-assist MCP module", () => {
  test("registers tools, prompts and resources", async () => {
    const server = mkServer();
    enrich(server);
    const analyze = getTool(server, "analyze-repository");
    const enumerate = getTool(server, "enumerate-capabilities");
    const planner = getTool(server, "plan-feature-implementation");
    expect(analyze).toBeTruthy();
    expect(enumerate).toBeTruthy();
    expect(planner).toBeTruthy();
  });

  test("analyze-repository extracts files and tests for ./decoration", async () => {
    const server = mkServer();
    enrich(server);
    const analyze: any = getTool(server, "analyze-repository");
    const res = await analyze.execute({
      repoPath: path.join(process.cwd(), "./decoration"),
    });
    const text = (res.content?.[0] as any)?.text || (res.content as any)?.text;
    const data = JSON.parse(text);
    expect(Array.isArray(data.files)).toBe(true);
    // should find at least one src file
    expect(data.files.length).toBeGreaterThan(0);
    // tests may or may not exist, but API object must be present
    expect(data.api && typeof data.api === "object").toBe(true);
  });

  test("enumerate-capabilities returns capabilities based on analysis", async () => {
    const server = mkServer();
    enrich(server);
    const enumerate: any = getTool(server, "enumerate-capabilities");
    const res = await enumerate.execute({
      repoPath: path.join(process.cwd(), "./decoration"),
    });
    const text = (res.content?.[0] as any)?.text || (res.content as any)?.text;
    const data = JSON.parse(text);
    expect(Array.isArray(data.capabilities)).toBe(true);
  });

  test("plan-feature-implementation suggests an execution plan using available tools", async () => {
    const server = mkServer();
    enrich(server);
    const planner: any = getTool(server, "plan-feature-implementation");
    const res = await planner.execute({
      feature: "override a decoration with a new flavour",
      repoPath: "./decoration",
    });
    const text = (res.content?.[0] as any)?.text || (res.content as any)?.text;
    const data = JSON.parse(text);
    expect(Array.isArray(data.plan)).toBe(true);
    // plan should include our analysis tool and apply-code-change steps
    expect(data.plan.some((s: any) => s.tool === "analyze-repository")).toBe(
      true
    );
    expect(data.plan.some((s: any) => s.tool === "apply-code-change")).toBe(
      true
    );
  });

  test("analyze-repository throws on invalid repo path", async () => {
    const server = mkServer();
    enrich(server);
    const analyze: any = getTool(server, "analyze-repository");
    await expect(
      analyze.execute({ repoPath: "/nonexistent/path/to/repo" })
    ).rejects.toThrow(/Repository not found/);
  });

  test("plan-feature-implementation for generic feature omits decorator-tools step", async () => {
    const server = mkServer();
    enrich(server);
    const planner: any = getTool(server, "plan-feature-implementation");
    const res = await planner.execute({
      feature: "add logging to certain functions",
      repoPath: "./decoration",
    });
    const text = (res.content?.[0] as any)?.text || (res.content as any)?.text;
    const data = JSON.parse(text);
    expect(data.plan.some((s: any) => s.tool === "decorator-tools")).toBe(
      false
    );
  });
});
