import { z } from "zod";
import type { Tool } from "fastmcp";

export const analyzeRepoSchema = z
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

export const enumerateCapabilitiesSchema = z
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

export const planFeatureSchema = z
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


export const documentCodeSchema = z
  .object({
    filePath: z.string().min(1, "filePath is required"),
    promptName: z.string().optional(),
    includePrompt: z.boolean().default(true),
    includeCode: z.boolean().default(true),
    includeMetadata: z.boolean().default(true),
    additionalContext: z.string().optional(),
    encoding: z.string().default("utf8"),
  })
  .strict();

export const codeChangeSchema = z
  .object({
    filePath: z.string().min(1, "filePath is required"),
    patch: z.string().min(1, "patch is required"),
    dryRun: z.boolean().default(false),
    showDiff: z.boolean().default(true),
    diffContext: z.number().int().min(0).max(100).default(3),
    encoding: z.string().default("utf8"),
  })
  .strict();
