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
    expect(resources.length).toBeGreaterThanOrEqual(3);
    const names = resources.map((template) => template.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "vscode-workspace-file",
        "cursor-workspace-file",
        "copilot-workspace-file",
        "codex-prompt",
      ])
    );
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
      const args = template.arguments.reduce<Record<string, string>>(
        (acc, argument: { name: string }) => {
          acc[argument.name] = "";
          return acc;
        },
        {}
      );

      if ("name" in args) {
        args.name = "doc";
        const output = await template.load(args as any);
        expect(output.text.length).toBeGreaterThan(0);
        continue;
      }

      if (template.name === "read-code-from-source") {
        args.path = "module.ts";
      } else if (template.name === "read-test-from-source") {
        const testFile = path.join(workspace, "tests", "module.test.ts");
        fs.mkdirSync(path.dirname(testFile), { recursive: true });
        fs.writeFileSync(testFile, "test file\n");
        args.path = "module.test.ts";
      } else if (template.name === "read-doc-from-source") {
        const docFile = path.join(workspace, "workdocs", "module.md");
        fs.mkdirSync(path.dirname(docFile), { recursive: true });
        fs.writeFileSync(docFile, "# Module\n");
        args.path = "module.md";
      } else {
        args.path = filePath;
      }

      const result = await template.load(args as any);
      expect(result.text.length).toBeGreaterThan(0);
    }
  });
});
