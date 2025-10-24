import fs from "fs";
import os from "os";
import path from "path";
import type { ContentResult } from "fastmcp";
import {
  documentObjectTool,
  coverageEnforcerTool,
  readmeImprovementTool,
} from "../../src/mcp/tools/codex-tools";
import {
  buildObjectPrompts,
  refreshPrompts,
  getObjectPromptDependencies,
} from "../../src/mcp/prompts/prompts";
import { resources } from "../../src/mcp/resources";
import {
  buildCodexPromptTemplates,
  buildDecorationResourceTemplates,
  buildWorkspaceResourceTemplates,
} from "../../src/mcp/templates";
import { getWorkspaceRoot, setWorkspaceRoot } from "../../src/mcp";

describe("codex-driven MCP tools", () => {
  const originalRoot = getWorkspaceRoot();
  let workspace = "";

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), "codex-tools-"));
    setWorkspaceRoot(workspace);

    const promptSource = path.join(originalRoot, ".codex", "prompts");
    const promptTarget = path.join(workspace, ".codex", "prompts");
    fs.mkdirSync(promptTarget, { recursive: true });
    for (const file of fs.readdirSync(promptSource)) {
      const src = path.join(promptSource, file);
      const dest = path.join(promptTarget, file);
      fs.copyFileSync(src, dest);
    }

    const srcDir = path.join(workspace, "src");
    const testsDir = path.join(workspace, "tests");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.mkdirSync(testsDir, { recursive: true });
    fs.writeFileSync(
      path.join(srcDir, "index.ts"),
      "export const answer = 42;\n"
    );
    fs.writeFileSync(
      path.join(testsDir, "index.test.ts"),
      "describe('index', () => it('works', () => expect(true).toBe(true)));\n"
    );

    const coverageDir = path.join(
      workspace,
      "workdocs",
      "reports",
      "coverage"
    );
    fs.mkdirSync(coverageDir, { recursive: true });
    const coverageData = {
      [path.join(workspace, "src", "index.ts")]: {
        s: { 0: 1, 1: 1 },
        f: { 0: 1 },
        b: { 0: [1, 0] },
      },
      [path.join(workspace, "src", "extra.ts")]: {
        s: { 0: 1, 1: 0 },
        f: { 0: 0 },
        b: { 0: [0, 0] },
      },
    };
    fs.writeFileSync(
      path.join(coverageDir, "coverage-final.json"),
      JSON.stringify(coverageData, null, 2)
    );
  });

  afterEach(() => {
    setWorkspaceRoot(originalRoot);
    if (workspace && fs.existsSync(workspace)) {
      fs.rmSync(workspace, { recursive: true, force: true });
    }
  });

  test("document-object returns prompt guidance and file inventory", async () => {
    const result = (await documentObjectTool.execute({
      basePath: ".",
      objectType: "module",
      includeContent: true,
      targetFile: "src/index.ts",
    })) as ContentResult;

    const payload = JSON.parse(result.content[0].text);
    expect(payload.objectType).toBe("module");
    expect(Array.isArray(payload.guidance)).toBe(true);
    expect(payload.guidance.length).toBeGreaterThan(0);
    expect(payload.files.source).toContain("src/index.ts");
    expect(payload.targetFileContent).toContain("answer");
  });

  test("ensure-test-coverage parses coverage report and highlights weakest files", async () => {
    const result = (await coverageEnforcerTool.execute({
      basePath: ".",
      coverage: 80,
      dryRun: true,
    })) as ContentResult;

    const payload = JSON.parse(result.content[0].text);
    expect(payload.meetsThreshold).toBe(false);
    expect(payload.totals.statements.pct).toBeGreaterThan(0);
    expect(payload.weakest.length).toBeGreaterThan(0);
    expect(payload.guidance[0].name).toBe("bulk-tests");
  });

  test("improve-readme summarises repository analysis and prompts", async () => {
    const result = (await readmeImprovementTool.execute({
      basePath: ".",
      includeExamples: true,
    })) as ContentResult;

    const payload = JSON.parse(result.content[0].text);
    expect(payload.summary.totalSourceFiles).toBe(1);
    expect(payload.guidance.some((section: any) => section.name === "update-readme")).toBe(
      true
    );
    expect(Array.isArray(payload.suggestedExamples)).toBe(true);
  });

  test("resource templates expose codex, workspace, and decoration helpers", async () => {
    const workspaceTemplates = buildWorkspaceResourceTemplates();
    const codexTemplates = buildCodexPromptTemplates();
    const decorationTemplates = buildDecorationResourceTemplates();

    expect(workspaceTemplates).toHaveLength(3);
    expect(codexTemplates[0].name).toBe("codex-prompt");
    expect(decorationTemplates).toHaveLength(3);

    const codexResult = await codexTemplates[0].load({ name: "doc" });
    expect(codexResult.text.length).toBeGreaterThan(0);
  });

  test("resources list codex prompts and resolved guidance", async () => {
    const [indexResource, objectResource] = resources;
    const index = await indexResource.load();
    const parsed = JSON.parse(index.text);
    expect(parsed.prompts.length).toBeGreaterThan(0);

    const objects = await objectResource.load();
    const parsedObjects = JSON.parse(objects.text);
    expect(parsedObjects.prompts.length).toBeGreaterThan(0);
  });

  test("document-object rejects paths outside workspace", async () => {
    await expect(
      documentObjectTool.execute({
        basePath: "../outside",
        objectType: "module",
        includeContent: false,
      })
    ).rejects.toThrow(/workspace root/);
  });

  test("document-object rejects target files outside workspace", async () => {
    await expect(
      documentObjectTool.execute({
        basePath: ".",
        objectType: "module",
        includeContent: true,
        targetFile: "../escape.ts",
      })
    ).rejects.toThrow(/workspace root/);
  });

  test("ensure-test-coverage surfaces command failures", async () => {
    await expect(
      coverageEnforcerTool.execute({ basePath: ".", coverage: 80, dryRun: false })
    ).rejects.toThrow();
  });

  test("ensure-test-coverage reports missing reports", async () => {
    const coverageFile = path.join(
      workspace,
      "workdocs",
      "reports",
      "coverage",
      "coverage-final.json"
    );
    fs.unlinkSync(coverageFile);

    await expect(
      coverageEnforcerTool.execute({ basePath: ".", coverage: 80, dryRun: true })
    ).rejects.toThrow(/Coverage report not found/);
  });

  test("readme improvement can skip example harvest", async () => {
    const result = (await readmeImprovementTool.execute({
      basePath: ".",
      includeExamples: false,
    })) as ContentResult;
    const payload = JSON.parse(result.content[0].text);
    expect(payload.suggestedExamples).toEqual([]);
  });

  test("object prompt helpers aggregate codex guidance", async () => {
    const deps = getObjectPromptDependencies();
    expect(deps.class).toEqual(expect.arrayContaining(["doc", "class"]));

    const objectPrompts = buildObjectPrompts();
    const modulePrompt = objectPrompts.find((prompt) => prompt.name === "codex/module");
    expect(modulePrompt).toBeDefined();

    const refreshed = refreshPrompts(".");
    const names = refreshed.map((prompt) => prompt.name);
    expect(names).toEqual(expect.arrayContaining(["codex/module", "decoration-overview"]));
  });
});
