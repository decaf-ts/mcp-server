import { createServer } from "../../src/mcp";

describe("McpServer help tool", () => {
  test("help returns empty lists when nothing registered", async () => {
    const s = createServer({ name: "test-mcp", version: "0.0.0" });
    const res = await s.help();
    expect(res).toHaveProperty("tools");
    expect(res.tools).toEqual([]);
    expect(res.prompts).toEqual([]);
    expect(res.resources).toEqual([]);
    expect(res.templates).toEqual([]);
  });

  test("help lists registered tool and details when queried", async () => {
    const s = createServer({ name: "test-mcp", version: "0.0.0" });
    await s.registerTool(
      "echo",
      { title: "Echo", description: "Echoes back" },
      async (args: any) => ({
        content: [{ type: "text", text: args?.text ?? "" }],
        structuredContent: args,
      })
    );

    const summary = await s.help();
    expect(summary.tools).toContain("echo");

    const detail = await s.help("tool echo");
    expect(detail).toHaveProperty("type", "tool");
    expect(detail).toHaveProperty("id", "echo");
    expect(detail.meta).toMatchObject({
      title: "Echo",
      description: "Echoes back",
    });
  });
});
