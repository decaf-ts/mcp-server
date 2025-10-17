import fs from "fs";
import path from "path";
import { ContentResult, Tool } from "fastmcp";
import {
  analyzeRepoSchema,
  enumerateCapabilitiesSchema,
  planFeatureSchema,
} from "../schemas";
import { analyzeRepo } from "../code";
import { deriveCapabilities } from "../utils";
import { getWorkspaceRoot } from "../mcp-module";
import { applyPatch, createTwoFilesPatch } from "diff";

export function buildAnalyzeRepositoryTool(): Tool<
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

export function buildEnumerateCapabilitiesTool(): Tool<
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

export function buildPlanFeatureTool(): Tool<
  undefined,
  typeof planFeatureSchema
> {
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


export const documentCodeTool: Tool<undefined, typeof documentCodeSchema> = {
  annotations: {
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: "Document Source File",
  },
  description:
    "Generate documentation guidance for a file by combining repository prompts with the target source code.",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (input, _context): Promise<ContentResult> => {
    const args = documentCodeSchema.parse(input as DocumentCodeArgs);
    const root = getWorkspaceRoot();
    let filePath: string;
    try {
      filePath = resolveInWorkspace(root, args.filePath);
    } catch (error) {
      if (error instanceof WorkspaceError) {
        return throwUserError(error.message);
      }
      /* istanbul ignore next */
      throw error;
    }

    if (!fs.existsSync(filePath)) {
      return throwUserError(`Cannot document missing file at ${args.filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, {
      encoding: args.encoding as BufferEncoding,
    });
    const prompts = discoverDocPrompts(root);

    if (!prompts.length) {
      return throwUserError(
        "No documentation prompts found under .code/prompts or .codex/prompts"
      );
    }

    const prompt = selectPrompt(
      prompts,
      args.promptName ?? DEFAULT_PROMPT_NAME
    );

    return buildDocumentationPayload({
      filePath: args.filePath,
      fileContent,
      prompt,
      includeCode: args.includeCode,
      includePrompt: args.includePrompt,
      includeMetadata: args.includeMetadata,
      additionalContext: args.additionalContext,
    });
  },
  name: "document-code",
  parameters: documentCodeSchema,
};

export const applyCodeChangeTool: Tool<undefined, typeof codeChangeSchema> = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: "Apply Code Patch",
  },
  description:
    "Apply a unified diff patch to a workspace file with optional dry-run validation and diff preview.",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (input, _context): Promise<string | ContentResult> => {
    const args = codeChangeSchema.parse(input as ApplyCodeChangeArgs);
    const root = getWorkspaceRoot();
    let filePath: string;
    try {
      filePath = resolveInWorkspace(root, args.filePath);
    } catch (error) {
      if (error instanceof WorkspaceError) {
        return throwUserError(error.message);
      }
      throw error;
    }

    const original = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, args.encoding as BufferEncoding)
      : "";

    let patched: string | false;
    try {
      patched = applyPatch(original, args.patch);
    } catch (error) {
      return throwUserError(
        `Failed to apply provided patch to ${args.filePath}: ${error instanceof Error ? error.message : error}`
      );
    }
    /* istanbul ignore next */
    if (patched === false) {
      return throwUserError(
        `Failed to apply provided patch to ${args.filePath}`
      );
    }

    if (!args.dryRun) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, patched, {
        encoding: args.encoding as BufferEncoding,
      });
    }

    if (!args.showDiff) {
      return `Patch ${args.dryRun ? "validated" : "applied"} for ${args.filePath}`;
    }

    const preview = createTwoFilesPatch(
      args.filePath,
      args.filePath,
      original,
      patched,
      undefined,
      undefined,
      { context: args.diffContext }
    );

    return {
      content: [
        {
          type: "text",
          text: `Patch ${args.dryRun ? "validated" : "applied"} for ${args.filePath}`,
        },
        {
          type: "text",
          text: ["```diff", preview.trim(), "```"].join("\n"),
        },
      ],
    } satisfies ContentResult;
  },
  name: "apply-code-change",
  parameters: codeChangeSchema,
};

