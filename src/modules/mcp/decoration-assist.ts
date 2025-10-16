import fs from "fs";
import path from "path";
import { z } from "zod";
import type { FastMCP, Tool, InputPrompt } from "fastmcp";
import { VERSION as V, PACKAGE_NAME as PKG } from "../../metadata";

// Utility: safe read file
function readFileSafe(
  filePath: string,
  encoding: BufferEncoding = "utf8"
): string | undefined {
  try {
    return fs.readFileSync(filePath, { encoding });
  } catch {
    return undefined;
  }
}

function listFilesRecursive(
  root: string,
  matcher?: (p: string) => boolean
): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const f of fs.readdirSync(cur)) stack.push(path.join(cur, f));
    } else if (!matcher || matcher(cur)) {
      out.push(cur);
    }
  }
  return out.sort();
}

// Zod Schemas (with explicit descriptions)
const analyzeRepoSchema = z
  .object({
    repoPath: z
      .string({
        description:
          "Relative or absolute path to the target repository inside this monorepo, e.g. './decoration'.",
      })
      .min(1, "repoPath is required"),
    includeTests: z
      .boolean({
        description:
          "If true, analyze the tests directory (if present) to derive expected behaviors.",
      })
      .default(true),
    includeDocs: z
      .boolean({
        description:
          "If true, analyze README.md and docs directories to extract documented features.",
      })
      .default(true),
  })
  .strict()
  .describe(
    "Analyze a local repository (e.g. ./decoration) to extract APIs, features, tests, and documentation cues."
  );

const enumerateCapabilitiesSchema = z
  .object({
    repoPath: z
      .string({
        description:
          "Relative or absolute path to the target repository to enumerate developer-facing capabilities.",
      })
      .min(1, "repoPath is required"),
  })
  .strict()
  .describe(
    "Enumerate the complete set of capabilities a developer is expected to use from the given repository."
  );

const planFeatureSchema = z
  .object({
    feature: z
      .string({
        description:
          "Natural-language description of a developer's requested feature or task to implement using the repository and available MCP tools.",
      })
      .min(5, "feature must describe the goal clearly"),
    repoPath: z
      .string({
        description:
          "Target repository path providing the library to use, e.g. './decoration'.",
      })
      .default("./decoration"),
  })
  .strict()
  .describe(
    "Plan which MCP tools to use and in what sequence to implement a requested feature using the repository."
  );

// Types
export type AnalyzeRepoArgs = z.infer<typeof analyzeRepoSchema>;
export type EnumerateCapabilitiesArgs = z.infer<
  typeof enumerateCapabilitiesSchema
>;
export type PlanFeatureArgs = z.infer<typeof planFeatureSchema>;

// Analysis helpers (minimal yet effective, text-based to avoid heavy AST deps)
function isSourceFile(p: string) {
  return /\.(ts|tsx|js|jsx)$/.test(p) && !p.endsWith(".d.ts");
}
function isTestFile(p: string) {
  return /(\.test\.|\.spec\.)/.test(p);
}

function extractExports(fileContent: string): string[] {
  const names = new Set<string>();
  const exportRe =
    /(export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+)([A-Za-z0-9_]+)/g;
  const namedRe = /export\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = exportRe.exec(fileContent))) names.add(m[2]);
  while ((m = namedRe.exec(fileContent))) {
    m[1]
      .split(",")
      .map((s) => s.trim().split(" as ")[0].trim())
      .forEach((n) => {
        if (n) names.add(n);
      });
  }
  return [...names].sort();
}

function extractDecorators(fileContent: string): string[] {
  const decs = new Set<string>();
  const decRe = /@([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = decRe.exec(fileContent))) decs.add(m[1]);
  return [...decs].sort();
}

function summarizeReadme(readme?: string) {
  if (!readme) return undefined;
  const lines = readme.split(/\r?\n/).filter(Boolean);
  const title =
    lines.find((l) => /^#\s+/.test(l))?.replace(/^#\s+/, "") || "README";
  const bullets = lines.filter((l) => /^[-*]\s+/.test(l)).slice(0, 20);
  return { title, bullets };
}

function analyzeRepo(root: string) {
  const src = path.join(root, "src");
  const testDir = path.join(root, "tests");
  const readmePath = path.join(root, "README.md");
  const readme = readFileSafe(readmePath);

  const files = fs.existsSync(src) ? listFilesRecursive(src, isSourceFile) : [];
  const testFiles = fs.existsSync(testDir)
    ? listFilesRecursive(testDir, (f) => isSourceFile(f) && isTestFile(f))
    : [];

  const api: Record<string, { exports: string[]; decorators: string[] }> = {};
  for (const f of files) {
    const content = readFileSafe(f) || "";
    api[path.relative(root, f)] = {
      exports: extractExports(content),
      decorators: extractDecorators(content),
    };
  }
  const tests: Record<string, { mentions: string[] }> = {};
  for (const f of testFiles) {
    const content = readFileSafe(f) || "";
    const mentions = Array.from(
      new Set([...extractExports(content), ...extractDecorators(content)])
    ).sort();
    tests[path.relative(root, f)] = { mentions };
  }
  return { files, testFiles, api, tests, readme: summarizeReadme(readme) };
}

// Tools
function buildAnalyzeRepositoryTool(): Tool<
  undefined,
  typeof analyzeRepoSchema
> {
  return {
    name: "analyze-repository",
    description:
      "Analyze a local repository's source, tests, and docs to extract exported APIs, decorators, and test mentions.",
    parameters: analyzeRepoSchema,
    execute: async (input) => {
      let repoRoot = path.resolve(process.cwd(), input.repoPath);
      if (!fs.existsSync(repoRoot)) {
        // try resolving from monorepo root (parent of current cwd)
        const alt = path.resolve(process.cwd(), "..", input.repoPath);
        if (fs.existsSync(alt)) repoRoot = alt;
      }
      if (!fs.existsSync(repoRoot)) {
        // if input was absolute and still not found, try ../<basename>
        const alt2 = path.resolve(
          process.cwd(),
          "..",
          path.basename(input.repoPath)
        );
        if (fs.existsSync(alt2)) repoRoot = alt2;
      }
      if (!fs.existsSync(repoRoot))
        throw new Error(`Repository not found at ${repoRoot}`);
      const result = analyzeRepo(repoRoot);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  };
}

function deriveCapabilities(
  analysis: ReturnType<typeof analyzeRepo>
): string[] {
  const cap = new Set<string>();
  // heuristics: if decorators like Decoration, flavouredAs, extend, override appear, add capabilities
  const allDecs = new Set<string>();
  for (const k of Object.keys(analysis.api)) {
    for (const d of analysis.api[k].decorators) allDecs.add(d);
    for (const e of analysis.api[k].exports)
      if (/Decoration|decorate|Builder|Flavour/i.test(e))
        cap.add("use-decoration-api");
  }
  if ([...allDecs].some((d) => /override|extend/i.test(d)))
    cap.add("override-and-extend-decorations");
  if (Object.keys(analysis.tests).length > 0) cap.add("validate-with-tests");
  if (analysis.readme) cap.add("follow-readme-guides");
  return [...cap].sort();
}

function buildEnumerateCapabilitiesTool(): Tool<
  undefined,
  typeof enumerateCapabilitiesSchema
> {
  return {
    name: "enumerate-capabilities",
    description:
      "Enumerate developer-facing capabilities of the given repository, inferred from code, tests, and docs.",
    parameters: enumerateCapabilitiesSchema,
    execute: async (input) => {
      let repoRoot = path.resolve(process.cwd(), input.repoPath);
      if (!fs.existsSync(repoRoot)) {
        const alt = path.resolve(process.cwd(), "..", input.repoPath);
        if (fs.existsSync(alt)) repoRoot = alt;
      }
      if (!fs.existsSync(repoRoot)) {
        const alt2 = path.resolve(
          process.cwd(),
          "..",
          path.basename(input.repoPath)
        );
        if (fs.existsSync(alt2)) repoRoot = alt2;
      }
      if (!fs.existsSync(repoRoot))
        throw new Error(`Repository not found at ${repoRoot}`);
      const analysis = analyzeRepo(repoRoot);
      const capabilities = deriveCapabilities(analysis);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                capabilities,
                analysisSummary: {
                  files: analysis.files.length,
                  testFiles: analysis.testFiles.length,
                  readme: analysis.readme?.title,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    },
  };
}

function buildPlanFeatureTool(): Tool<undefined, typeof planFeatureSchema> {
  return {
    name: "plan-feature-implementation",
    description:
      "Given a feature request, select appropriate MCP tools (including existing and new ones) and produce an execution plan.",
    parameters: planFeatureSchema,
    execute: async (input) => {
      const steps: Array<{
        step: number;
        action: string;
        tool?: string;
        arguments?: Record<string, any>;
        rationale: string;
      }> = [];
      let i = 1;
      steps.push({
        step: i++,
        action: "Analyze repository to enumerate APIs and decorators",
        tool: "analyze-repository",
        arguments: { repoPath: input.repoPath },
        rationale: "Understand available building blocks.",
      });
      steps.push({
        step: i++,
        action: "List capabilities expected for developers",
        tool: "enumerate-capabilities",
        arguments: { repoPath: input.repoPath },
        rationale: "Align the plan with supported capabilities.",
      });
      // Suggest existing generic tools from mcp-module
      steps.push({
        step: i++,
        action:
          "Select documentation prompt and gather relevant source file(s)",
        tool: "document-code",
        arguments: { filePath: "<target-file>" },
        rationale: "Provide context and instructions for changes.",
      });
      steps.push({
        step: i++,
        action: "Apply code changes using unified diff patch",
        tool: "apply-code-change",
        arguments: {
          filePath: "<target-file>",
          patch: "<unified-diff>",
          dryRun: true,
        },
        rationale: "Validate changes safely before committing.",
      });
      steps.push({
        step: i++,
        action: "Commit code changes",
        tool: "apply-code-change",
        arguments: {
          filePath: "<target-file>",
          patch: "<unified-diff>",
          dryRun: false,
        },
        rationale: "Persist the update.",
      });
      // If decoration-related terms present, suggest decorator tools
      if (/decorat|flavour|override|extend|builder/i.test(input.feature)) {
        steps.unshift({
          step: 0,
          action: "Use decorator tooling to insert/remove/modify decorators",
          tool: "decorator-tools",
          arguments: { action: "help" },
          rationale: "Leverage specialized utilities for decoration patterns.",
        });
        steps.forEach((s, idx) => (s.step = idx + 1));
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                plan: steps,
                notes:
                  "Replace placeholder arguments like <target-file> and <unified-diff> based on the analysis output.",
              },
              null,
              2
            ),
          },
        ],
      };
    },
  };
}

function buildPrompts(repoPath: string): InputPrompt<undefined>[] {
  return [
    {
      name: "decoration-overview",
      description:
        "High-level guidance on using the decoration library: key exports, decorators, and common workflows.",
      load: async () =>
        `You are assisting with the Decaf.ts decoration module located at ${repoPath}. Prefer using exported builders and decorators over ad-hoc patterns.\n\nProvide a concise, actionable overview of how to use the decoration APIs for extending and overriding behaviors.`,
    },
  ];
}

type DecorationResourceTemplate = {
  name: string;
  description: string;
  uriTemplate: string;
  mimeType: string;
  arguments: ReadonlyArray<{
    name: string;
    description: string;
    required: boolean;
  }>;
  load: (args: { path: string }) => Promise<{ text: string }>;
};
function buildResourceTemplates(
  repoPath: string
): DecorationResourceTemplate[] {
  const root = path.resolve(process.cwd(), repoPath);
  return [
    {
      name: "decoration-src",
      description: "Read a file from the decoration/src tree by relative path.",
      mimeType: "text/plain",
      uriTemplate: "decoration://src/{path}",
      arguments: [
        {
          name: "path",
          description:
            "Path under decoration/src to load, e.g. 'decoration/types.ts'",
          required: true,
        },
      ],
      load: async ({ path: rel }: { path: string }) => {
        const abs = path.join(root, "src", rel);
        const text = readFileSafe(abs) ?? "";
        return { text };
      },
    },
  ];
}

export default function enrich(mcp: FastMCP) {
  // Register tools
  mcp.addTool(buildAnalyzeRepositoryTool() as any);
  mcp.addTool(buildEnumerateCapabilitiesTool() as any);
  mcp.addTool(buildPlanFeatureTool() as any);
  // Prompts/resources
  const repoPath = "./decoration";
  for (const p of buildPrompts(repoPath)) mcp.addPrompt(p as any);
  for (const r of buildResourceTemplates(repoPath))
    mcp.addResourceTemplate(r as any);
  return mcp;
}

export const VERSION = V;
export const PACKAGE_NAME = `${PKG}/decoration-assist`;
