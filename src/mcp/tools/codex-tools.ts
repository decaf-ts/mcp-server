import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import type { ContentResult, Tool } from "fastmcp";
import {
  documentObjectSchema,
  coverageTaskSchema,
  readmeImprovementSchema,
} from "../schemas";
import {
  DocumentObjectArgs,
  CoverageTaskArgs,
  ReadmeImprovementArgs,
} from "../types";
import {
  getWorkspaceRoot,
  resolveInWorkspace,
  throwUserError,
  WorkspaceError,
} from "../workspace";
import {
  buildObjectPrompts,
  discoverDocPrompts,
  getObjectPromptDependencies,
} from "../prompts/prompts";
import { listFilesRecursive, readFileSafe } from "../utils";
import { analyzeRepo, isSourceFile, isTestFile } from "../code";

type PromptSection = {
  name: string;
  title: string;
  description: string;
  content: string;
};

function relativeFiles(root: string, files: string[]): string[] {
  return files.map((file) => path.relative(root, file)).sort();
}

function collectPromptSections(names: readonly string[]): PromptSection[] {
  const root = getWorkspaceRoot();
  const promptIndex = new Map(
    discoverDocPrompts(root).map((prompt) => [prompt.name, prompt])
  );
  return names
    .map((name) => promptIndex.get(name))
    .filter((prompt): prompt is PromptSection => Boolean(prompt))
    .map((prompt) => ({
      name: prompt.name,
      title: prompt.title,
      description: prompt.description,
      content: prompt.content,
    }));
}

function parseTaskLines(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^task\s+\d+/i.test(line));
}

function computeCoverageFromFinal(coveragePath: string) {
  const payload = JSON.parse(fs.readFileSync(coveragePath, "utf8")) as Record<
    string,
    {
      s: Record<string, number>;
      f: Record<string, number>;
      b: Record<string, number | number[]>;
    }
  >;

  const totals = {
    statements: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
  };

  const files = Object.entries(payload).map(([filePath, info]) => {
    const statementCounts = Object.values(info.s);
    const functionCounts = Object.values(info.f);
    const branchCounts = Object.values(info.b).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    );

    const statementTotal = statementCounts.length;
    const functionTotal = functionCounts.length;
    const branchTotal = branchCounts.length;

    const statementCovered = statementCounts.filter((count) => count > 0).length;
    const functionCovered = functionCounts.filter((count) => count > 0).length;
    const branchCovered = branchCounts.filter((count) => count > 0).length;

    totals.statements.covered += statementCovered;
    totals.statements.total += statementTotal;
    totals.functions.covered += functionCovered;
    totals.functions.total += functionTotal;
    totals.branches.covered += branchCovered;
    totals.branches.total += branchTotal;

    const pct = (covered: number, total: number) =>
      total === 0 ? 100 : Number(((covered / total) * 100).toFixed(2));

    return {
      path: filePath,
      statements: pct(statementCovered, statementTotal),
      functions: pct(functionCovered, functionTotal),
      branches: pct(branchCovered, branchTotal),
    };
  });

  const pct = (covered: number, total: number) =>
    total === 0 ? 100 : Number(((covered / total) * 100).toFixed(2));

  return {
    totals: {
      statements: { ...totals.statements, pct: pct(totals.statements.covered, totals.statements.total) },
      functions: { ...totals.functions, pct: pct(totals.functions.covered, totals.functions.total) },
      branches: { ...totals.branches, pct: pct(totals.branches.covered, totals.branches.total) },
    },
    files,
  };
}

function normalizePromptSections(sections: PromptSection[]) {
  return sections.map((section) => ({
    name: section.name,
    title: section.title,
    tasks: parseTaskLines(section.content),
    content: section.content,
  }));
}

async function resolveRepoRoot(basePath: string) {
  const root = getWorkspaceRoot();
  try {
    return resolveInWorkspace(root, basePath);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      await throwUserError(error.message);
    }
    throw error;
  }
}

export const documentObjectTool: Tool<undefined, typeof documentObjectSchema> = {
  name: "document-object",
  description:
    "Create a documentation plan for a specific object type using .codex prompts and repository analysis.",
  parameters: documentObjectSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (input, _context): Promise<ContentResult> => {
    const args = documentObjectSchema.parse(input as DocumentObjectArgs);
    const repoRoot = await resolveRepoRoot(args.basePath);

    const dependencies =
      getObjectPromptDependencies()[args.objectType] ?? [];
    if (!dependencies.length) {
      await throwUserError(
        `No prompt guidance configured for object type ${args.objectType}`
      );
    }

    const sections = normalizePromptSections(
      collectPromptSections(dependencies)
    );

    const srcDir = path.join(repoRoot, "src");
    const testDir = path.join(repoRoot, "tests");

    const sourceFiles = fs.existsSync(srcDir)
      ? listFilesRecursive(srcDir, isSourceFile)
      : [];
    const testFiles = fs.existsSync(testDir)
      ? listFilesRecursive(testDir, (file) => isSourceFile(file) && isTestFile(file))
      : [];

    let targetFileContent: string | undefined;
    if (args.targetFile) {
      try {
        const absolute = resolveInWorkspace(repoRoot, args.targetFile);
        targetFileContent = readFileSafe(absolute) ?? undefined;
      } catch (error) {
        if (error instanceof WorkspaceError) {
          await throwUserError(error.message);
        }
        throw error;
      }
    }

    const payload = {
      basePath: path.relative(getWorkspaceRoot(), repoRoot) || ".",
      objectType: args.objectType,
      targetFile: args.targetFile,
      guidance: sections,
      files: {
        source: relativeFiles(repoRoot, sourceFiles),
        tests: relativeFiles(repoRoot, testFiles),
      },
      targetFileContent: args.includeContent ? targetFileContent : undefined,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    } satisfies ContentResult;
  },
};

export const coverageEnforcerTool: Tool<undefined, typeof coverageTaskSchema> = {
  name: "ensure-test-coverage",
  description:
    "Run the configured coverage command and report whether the target percentage is met, highlighting weak files.",
  parameters: coverageTaskSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (input, _context): Promise<ContentResult> => {
    const args = coverageTaskSchema.parse(input as CoverageTaskArgs);
    const repoRoot = await resolveRepoRoot(args.basePath);

    if (!args.dryRun) {
      const env = {
        ...process.env,
        USE_WATCHMAN: "false",
        WATCHMAN_DISABLE: "1",
        JEST_DISABLE_WATCHMAN: "1",
      };
      const result = spawnSync(
        "npm",
        [
          "run",
          "coverage",
          "--",
          "--watchman=false",
          "--runInBand",
        ],
        { cwd: repoRoot, env, encoding: "utf8" }
      );

      if (result.status !== 0) {
        const message = result.stderr || result.stdout || "Coverage command failed";
        await throwUserError(message.trim());
      }
    }

    const coveragePath = path.join(
      repoRoot,
      "workdocs",
      "reports",
      "coverage",
      "coverage-final.json"
    );

    if (!fs.existsSync(coveragePath)) {
      await throwUserError(
        `Coverage report not found at ${path.relative(repoRoot, coveragePath)}`
      );
    }

    const summary = computeCoverageFromFinal(coveragePath);
    const meetsThreshold =
      summary.totals.statements.pct >= args.coverage &&
      summary.totals.functions.pct >= args.coverage &&
      summary.totals.branches.pct >= args.coverage;

    const weakest = [...summary.files]
      .sort((a, b) => a.statements - b.statements)
      .slice(0, 10);

    const guidance = normalizePromptSections(
      collectPromptSections(["bulk-tests"])
    );

    const payload = {
      basePath: path.relative(getWorkspaceRoot(), repoRoot) || ".",
      target: args.coverage,
      meetsThreshold,
      totals: summary.totals,
      weakest,
      guidance,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    } satisfies ContentResult;
  },
};

export const readmeImprovementTool: Tool<
  undefined,
  typeof readmeImprovementSchema
> = {
  name: "improve-readme",
  description:
    "Summarize required steps to refresh README and workdocs content using .codex guidance and repository analysis.",
  parameters: readmeImprovementSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (input, _context): Promise<ContentResult> => {
    const args = readmeImprovementSchema.parse(
      input as ReadmeImprovementArgs
    );
    const repoRoot = await resolveRepoRoot(args.basePath);

    const analysis = analyzeRepo(repoRoot);
    const modules = analysis.files
      .filter((file) => /index\.ts$/.test(file))
      .map((file) => path.relative(repoRoot, file));

    const promptSections = normalizePromptSections(
      collectPromptSections(["update-readme", "doc", "module"])
    );

    const testExamples = Object.keys(analysis.tests ?? {});
    const examples = args.includeExamples ? testExamples.slice(0, 20) : [];

    const payload = {
      basePath: path.relative(getWorkspaceRoot(), repoRoot) || ".",
      summary: {
        modules,
        totalSourceFiles: analysis.files.length,
        totalTestFiles: analysis.testFiles.length,
        hasReadme: Boolean(analysis.readme),
      },
      guidance: promptSections,
      suggestedExamples: examples,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    } satisfies ContentResult;
  },
};
