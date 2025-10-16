import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createTwoFilesPatch } from "diff";
import { FastMCP } from "fastmcp";
import enrich, {
  tools,
  setWorkspaceRoot,
  getWorkspaceRoot,
  buildResourceTemplates,
  buildDocPrompts,
} from "../../src/mcp";
import type { ContentResult } from "fastmcp";

describe("MCP module integration", () => {
  const originalRoot = getWorkspaceRoot();
  let workspace = "";

  function setupWorkspace() {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-mcp-int-"));
    setWorkspaceRoot(workspace);

    const promptDir = path.join(workspace, ".codex", "prompts");
    fs.mkdirSync(promptDir, { recursive: true });
    fs.writeFileSync(
      path.join(promptDir, "doc.md"),
      "Document every module with a summary and detailed description.\n"
    );

    const filePath = path.join(workspace, "src", "module.ts");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(
      filePath,
      "export function add(a: number, b: number) {\n  return a + b;\n}\n"
    );
  }

  afterEach(() => {
    setWorkspaceRoot(originalRoot);
    if (workspace && fs.existsSync(workspace)) {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
    workspace = "";
  });

  test("enrich registers prompts, tools, and resource templates", () => {
    setupWorkspace();
    const server = new FastMCP({ name: "test", version: "0.0.0" as any });

    expect(() => enrich(server)).not.toThrow();

    const prompts = buildDocPrompts();
    expect(prompts.length).toBeGreaterThan(0);

    const resources = buildResourceTemplates();
    expect(resources).toHaveLength(3);
  });

  test("document-code output can drive apply-code-change patches", async () => {
    setupWorkspace();
    const filePath = "src/module.ts";
    const absolute = path.join(workspace, filePath);

    const docResult = (await tools.documentCodeTool.execute(
      { filePath },
      {} as any
    )) as ContentResult;

    expect(docResult.content[0].text).toContain("module.ts");

    const original = fs.readFileSync(absolute, "utf-8");
    const updated = `/**\n * Adds two numbers together.\n */\n${original}`;
    const patch = createTwoFilesPatch(filePath, filePath, original, updated);

    await tools.applyCodeChangeTool.execute({ filePath, patch }, {} as unknown);

    const finalContent = fs.readFileSync(absolute, "utf-8");
    expect(finalContent.startsWith("/**\n * Adds two numbers together.")).toBe(
      true
    );
  });

  test("resource templates expose source files to IDE schemes", async () => {
    setupWorkspace();
    const filePath = "src/module.ts";
    const expected = fs.readFileSync(path.join(workspace, filePath), "utf-8");

    const templates = buildResourceTemplates();
    for (const template of templates) {
      const result = await template.load({ path: filePath } as any);
      expect(result).toMatchObject({ text: expected });
    }
  });
});
