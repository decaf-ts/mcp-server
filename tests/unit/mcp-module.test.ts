import fs from "fs";
import os from "os";
import path from "path";
import { createTwoFilesPatch } from "diff";
import {
  tools,
  setWorkspaceRoot,
  getWorkspaceRoot,
  buildDocPrompts,
  buildResourceTemplates,
} from "../../src/mcp";
import type { ContentResult } from "fastmcp";

describe("@decaf-ts/mcp-server mcp module", () => {
  const originalRoot = getWorkspaceRoot();
  let workspace: string;

  function makeWorkspace() {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-mcp-"));
    setWorkspaceRoot(workspace);

    const promptDir = path.join(workspace, ".codex", "prompts");
    fs.mkdirSync(promptDir, { recursive: true });
    fs.writeFileSync(path.join(promptDir, "doc.md"), "Use TSDoc to describe modules.\n");
    fs.writeFileSync(path.join(promptDir, "custom.md"), "Custom prompt guidance.\n");

    const filePath = path.join(workspace, "src", "sample.ts");
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "export const value = 1;\n");

    const moduleFile = path.join(workspace, "src", "module.ts");
    fs.writeFileSync(moduleFile, "export const value = 1;\n");

    const testFile = path.join(workspace, "tests", "sample.test.ts");
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(
      testFile,
      "describe('sample', () => it('works', () => expect(true).toBe(true)));\n"
    );

    const docFile = path.join(workspace, "workdocs", "note.md");
    fs.mkdirSync(path.dirname(docFile), { recursive: true });
    fs.writeFileSync(docFile, "# Notes\n");
  }

  afterEach(() => {
    setWorkspaceRoot(originalRoot);
    if (workspace && fs.existsSync(workspace)) {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
    workspace = "";
  });

  describe("document-code tool", () => {
    beforeEach(() => {
      makeWorkspace();
    });

    test("produces documentation scaffolding with code block", async () => {
      const result = (await tools.documentCodeTool.execute(
        { filePath: "src/sample.ts" },
        {} as unknown
      )) as ContentResult;

      expect(result.content).toHaveLength(1);
      const [block] = result.content;
      expect(block.type).toBe("text");
      expect(block.text).toContain("Documentation Request");
      expect(block.text).toContain("```ts");
    });

    test("selects named prompt when available", async () => {
      const result = (await tools.documentCodeTool.execute(
        { filePath: "src/sample.ts", promptName: "custom", includeMetadata: false },
        {} as unknown
      )) as ContentResult;

      const [block] = result.content;
      expect(block.text).toContain("Custom prompt guidance");
      expect(block.text).not.toContain("Documentation Request");
    });

    test("supports toggling sections and adding extra guidance", async () => {
      const result = (await tools.documentCodeTool.execute(
        {
          filePath: "src/sample.ts",
          includeCode: false,
          includePrompt: false,
          includeMetadata: false,
          additionalContext: "Document public APIs only.",
        },
        {} as unknown
      )) as ContentResult;

      const [block] = result.content;
      expect(block.text).toContain("Additional Context");
      expect(block.text).not.toContain("Documentation Request");
      expect(block.text).not.toContain("```ts");
    });

    test("falls back to default prompt when the requested name is missing", async () => {
      const result = (await tools.documentCodeTool.execute(
        { filePath: "src/sample.ts", promptName: "unknown" },
        {} as unknown
      )) as ContentResult;

      const [block] = result.content;
      expect(block.text).toContain("Use TSDoc to describe modules.");
    });

    test("rejects requests that escape the workspace root", async () => {
      await expect(
        tools.documentCodeTool.execute({ filePath: "../outside.ts" }, {} as unknown)
      ).rejects.toThrow(/escapes the workspace root/);
    });

    test("throws when no documentation prompts are available", async () => {
      const emptyWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-mcp-empty-"));
      setWorkspaceRoot(emptyWorkspace);
      const file = path.join(emptyWorkspace, "src", "solo.ts");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, "export const solo = true;\n");

      await expect(
        tools.documentCodeTool.execute({ filePath: "src/solo.ts" }, {} as unknown)
      ).rejects.toThrow(/No documentation prompts/);

      fs.rmSync(emptyWorkspace, { recursive: true, force: true });
      setWorkspaceRoot(workspace);
    });

    test("detects language for markdown and json sources", async () => {
      const mdPath = path.join(workspace, "docs", "note.md");
      const jsonPath = path.join(workspace, "data", "config.json");
      fs.mkdirSync(path.dirname(mdPath), { recursive: true });
      fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
      fs.writeFileSync(mdPath, "# Note\n");
      fs.writeFileSync(jsonPath, "{\"ok\":true}\n");

      const mdResult = (await tools.documentCodeTool.execute(
        { filePath: "docs/note.md" },
        {} as unknown
      )) as ContentResult;
      expect(mdResult.content[0].text).toContain("```md");

      const jsonResult = (await tools.documentCodeTool.execute(
        { filePath: "data/config.json" },
        {} as unknown
      )) as ContentResult;
      expect(jsonResult.content[0].text).toContain("```json");
    });

    test("throws when file is missing", async () => {
      await expect(
        tools.documentCodeTool.execute({ filePath: "src/missing.ts" }, {} as unknown)
      ).rejects.toThrow(/Cannot document missing file/);
    });

    test("exposes integration prompts for IDE clients", () => {
      const prompts = buildDocPrompts();
      const names = prompts.map((prompt) => prompt.name);
      expect(names).toEqual(expect.arrayContaining(["integration/vscode", "integration/cursor", "integration/copilot"]));

      const vscode = prompts.find((prompt) => prompt.name === "integration/vscode");
      expect(vscode).toBeDefined();
      return expect(vscode?.load({} as any)).resolves.toContain("Visual Studio Code");
    });
  });

  describe("apply-code-change tool", () => {
    const fileName = "src/module.ts";

    beforeEach(() => {
      makeWorkspace();
    });

    test("applies a patch and returns diff preview", async () => {
      const fullPath = path.join(workspace, fileName);
      const original = fs.readFileSync(fullPath, "utf-8");
      const updated = original.replace("1", "2");
      const patch = createTwoFilesPatch(fileName, fileName, original, updated, undefined, undefined, {
        context: 1,
      });

      const result = await tools.applyCodeChangeTool.execute(
        { filePath: fileName, patch },
        {} as unknown
      );

      const finalContent = fs.readFileSync(fullPath, "utf-8");
      expect(finalContent).toBe(updated);
      expect(typeof result).toBe("object");
      const diffText = (result as ContentResult).content[1].text;
      expect(diffText).toContain("+export const value = 2;");
    });

    test("supports dry-run validation without modifying files", async () => {
      const fullPath = path.join(workspace, fileName);
      const original = fs.readFileSync(fullPath, "utf-8");
      const updated = `${original}\nexport const bonus = true;\n`;
      const patch = createTwoFilesPatch(fileName, fileName, original, updated);

      const result = await tools.applyCodeChangeTool.execute(
        { filePath: fileName, patch, dryRun: true },
        {} as unknown
      );

      expect(fs.readFileSync(fullPath, "utf-8")).toBe(original);
      const text = (result as ContentResult).content[0].text;
      expect(text).toContain("validated");
    });

    test("returns summary string when showDiff is disabled", async () => {
      const fullPath = path.join(workspace, fileName);
      const original = fs.readFileSync(fullPath, "utf-8");
      const updated = original.replace("1", "3");
      const patch = createTwoFilesPatch(fileName, fileName, original, updated);

      const result = await tools.applyCodeChangeTool.execute(
        { filePath: fileName, patch, showDiff: false },
        {} as unknown
      );

      expect(typeof result).toBe("string");
      expect(result).toContain("Patch applied");
    });

    test("rejects invalid unified diff patches", async () => {
      await expect(
        tools.applyCodeChangeTool.execute(
          {
            filePath: fileName,
            patch: "--- src/module.ts\n+++ src/module.ts\n@@ -99,2 +99,2 @@\n+added\n",
          },
          {} as unknown
        )
      ).rejects.toThrow(/Failed to apply provided patch/);
    });

    test("prevents patching files outside the workspace", async () => {
      const patch = createTwoFilesPatch("outside.ts", "outside.ts", "", "content\n");
      await expect(
        tools.applyCodeChangeTool.execute(
          { filePath: "../outside.ts", patch },
          {} as unknown
        )
      ).rejects.toThrow(/escapes the workspace root/);
    });
  });

  describe("resource templates", () => {
    beforeEach(() => {
      makeWorkspace();
    });

    test("load workspace files for IDE schemes", async () => {
      const filePath = "src/sample.ts";
      const content = fs.readFileSync(path.join(workspace, filePath), "utf-8");

      for (const template of buildResourceTemplates()) {
        const args = template.arguments.reduce<Record<string, string>>(
          (acc, argument: { name: string }) => {
            acc[argument.name] = "";
            return acc;
          },
          {}
        );

        if ("name" in args) continue;

        if (template.name === "read-code-from-source") {
          args.path = "sample.ts";
        } else if (template.name === "read-test-from-source") {
          args.path = "sample.test.ts";
        } else if (template.name === "read-doc-from-source") {
          args.path = "note.md";
        } else {
          args.path = filePath;
        }

        const result = await template.load(args as any);
        expect(result.text.length).toBeGreaterThan(0);
      }
    });

    test("throws when accessing paths outside workspace", async () => {
      const template = buildResourceTemplates().find((candidate) =>
        candidate.arguments.some(
          (argument: { name: string }) => argument.name === "path"
        )
      );
      if (!template) {
        throw new Error("Expected at least one path-based template");
      }
      await expect(template.load({ path: "../hack.ts" } as any)).rejects.toThrow(
        /escapes the workspace root/
      );
    });
  });
});
