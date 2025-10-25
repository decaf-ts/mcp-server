import { z } from "zod";

export const analyzeRepoSchema = z
  .object({
    repoPath: z
      .string()
      .min(1, "repoPath is required")
      .describe(
        "Relative or absolute path to the target repository inside this monorepo, e.g. './decoration'."
      ),
    includeTests: z
      .boolean()
      .default(true)
      .describe(
        "If true, analyze the tests directory (if present) to derive expected behaviors."
      ),
    includeDocs: z
      .boolean()
      .default(true)
      .describe(
        "If true, analyze README.md and docs directories to extract documented features."
      ),
  })
  .strict()
  .describe(
    "Analyze a local repository (e.g. ./decoration) to extract APIs, features, tests, and documentation cues."
  );

export const enumerateCapabilitiesSchema = z
  .object({
    repoPath: z
      .string()
      .min(1, "repoPath is required")
      .describe(
        "Relative or absolute path to the target repository to enumerate developer-facing capabilities."
      ),
  })
  .strict()
  .describe(
    "Enumerate the complete set of capabilities a developer is expected to use from the given repository."
  );

export const planFeatureSchema = z
  .object({
    feature: z
      .string()
      .min(5, "feature must describe the goal clearly")
      .describe(
        "Natural-language description of a developer's requested feature or task to implement using the repository and available MCP tools."
      ),
    repoPath: z
      .string()
      .default("./decoration")
      .describe(
        "Target repository path providing the library to use, e.g. './decoration'."
      ),
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

const OBJECT_TYPES = [
  "module",
  "file",
  "class",
  "function",
  "interface",
  "decorator",
  "constant",
] as const;

export const documentObjectSchema = z
  .object({
    basePath: z.string().min(1, "basePath is required"),
    objectType: z.enum(OBJECT_TYPES),
    targetFile: z.string().optional(),
    includeContent: z.boolean().default(false),
  })
  .strict();

export const coverageTaskSchema = z
  .object({
    basePath: z.string().min(1, "basePath is required"),
    coverage: z
      .number()
      .min(0)
      .max(100)
      .default(90)
      .describe("Target coverage percentage"),
    dryRun: z.boolean().default(false),
  })
  .strict();

export const readmeImprovementSchema = z
  .object({
    basePath: z.string().min(1, "basePath is required"),
    includeExamples: z.boolean().default(true),
  })
  .strict();
