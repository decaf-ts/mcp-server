import fs from "fs";
import path from "path";
import type {
  FastMCP,
  ContentResult,
  InputPrompt,
  ResourceTemplate,
  Tool,
} from "fastmcp";
import { applyPatch, createTwoFilesPatch } from "diff";
import { z } from "zod";
import { PACKAGE_NAME as PKG, VERSION as V } from "../metadata";
import { decoratorTools } from "./decorator-tools";

const WORKSPACE_ROOT_ENV = "MCP_WORKSPACE_ROOT";
const PROMPT_DIRECTORIES = [".code/prompts", ".codex/prompts"];
const DEFAULT_PROMPT_NAME = "doc";
const CLIENT_INTEGRATIONS = [
  {
    id: "vscode",
    display: "Visual Studio Code",
    instructions:
      "When interacting from Visual Studio Code, prefer the vscode://workspace/{path} resource template to fetch file contents and use the apply-code-change tool to commit edits with previewable diffs.",
  },
  {
    id: "cursor",
    display: "Cursor",
    instructions:
      "Cursor clients can retrieve and update files through the cursor://workspace/{path} resource template. Always validate patches in dryRun mode before applying permanent changes.",
  },
  {
    id: "copilot",
    display: "GitHub Copilot",
    instructions:
      "Use the copilot://workspace/{path} resource template to stream file content into Copilot chat sessions. Prefer returning unified diffs to maintain alignment with Copilot's diff visualization.",
  },
] as const;

const documentCodeSchema = z
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

type DocumentCodeArgs = z.infer<typeof documentCodeSchema>;

const codeChangeSchema = z
  .object({
    filePath: z.string().min(1, "filePath is required"),
    patch: z.string().min(1, "patch is required"),
    dryRun: z.boolean().default(false),
    showDiff: z.boolean().default(true),
    diffContext: z.number().int().min(0).max(100).default(3),
    encoding: z.string().default("utf8"),
  })
  .strict();

type ApplyCodeChangeArgs = z.infer<typeof codeChangeSchema>;

type DocPrompt = {
  name: string;
  title: string;
  description: string;
  content: string;
  absolutePath: string;
};

type WorkspaceResourceTemplate = {
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

let workspaceRoot = initializeWorkspaceRoot();
let userErrorCtor: (new (message: string) => Error) | undefined;

class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

async function getUserErrorCtor(): Promise<new (message: string) => Error> {
  if (!userErrorCtor) {
    try {
      const mod = await import("fastmcp");
      userErrorCtor = (mod as { UserError: new (message: string) => Error }).UserError;
    } catch {
      /* istanbul ignore next */
      userErrorCtor = class MCPUserError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "MCPUserError";
        }
      };
    }
  }
  return userErrorCtor;
}

async function throwUserError(message: string): Promise<never> {
  const Ctor = await getUserErrorCtor();
  throw new Ctor(message);
}

const documentCodeTool: Tool<undefined, typeof documentCodeSchema> = {
  annotations: {
    idempotentHint: true,
    openWorldHint: false,
    readOnlyHint: true,
    title: "Document Source File",
  },
  description:
    "Generate documentation guidance for a file by combining repository prompts with the target source code.",
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

    const prompt = selectPrompt(prompts, args.promptName ?? DEFAULT_PROMPT_NAME);

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

const applyCodeChangeTool: Tool<undefined, typeof codeChangeSchema> = {
  annotations: {
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
    readOnlyHint: false,
    title: "Apply Code Patch",
  },
  description:
    "Apply a unified diff patch to a workspace file with optional dry-run validation and diff preview.",
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
      return throwUserError(`Failed to apply provided patch to ${args.filePath}`);
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

export const tools = {
  ...decoratorTools,
  documentCodeTool,
  applyCodeChangeTool,
} as const;

export function enrich(mcp: FastMCP): FastMCP {
  for (const prompt of buildDocPrompts()) {
    mcp.addPrompt(prompt as any);
  }

  for (const tool of Object.values(tools)) {
    mcp.addTool(tool as any);
  }

  for (const template of buildResourceTemplates()) {
    mcp.addResourceTemplate(template as any);
  }

  return mcp;
}

export default enrich;
export const PACKAGE_NAME = PKG;
export const VERSION = V;

export function setWorkspaceRoot(root: string) {
  workspaceRoot = path.resolve(root);
}

export function getWorkspaceRoot(): string {
  return workspaceRoot;
}

export function buildResourceTemplates(): WorkspaceResourceTemplate[] {
  const root = getWorkspaceRoot();
  const sharedArguments = [
    {
      name: "path",
      description: "Path relative to the workspace root",
      required: true,
    },
  ] as const;

  return [
    {
      name: "vscode-workspace-file",
      description: "Expose workspace files to Visual Studio Code via vscode:// URIs",
      uriTemplate: "vscode://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        const text = await readWorkspaceFile(root, args.path);
        return { text };
      },
    },
    {
      name: "cursor-workspace-file",
      description: "Expose workspace files to Cursor via cursor:// URIs",
      uriTemplate: "cursor://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        const text = await readWorkspaceFile(root, args.path);
        return { text };
      },
    },
    {
      name: "copilot-workspace-file",
      description: "Expose workspace files to GitHub Copilot via copilot:// URIs",
      uriTemplate: "copilot://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        const text = await readWorkspaceFile(root, args.path);
        return { text };
      },
    },
  ];
}

function initializeWorkspaceRoot(): string {
  const configured = process.env[WORKSPACE_ROOT_ENV];
  /* istanbul ignore next */
  if (configured && configured.trim().length > 0) {
    return path.resolve(configured.trim());
  }

  return process.cwd();
}

export function buildDocPrompts(): InputPrompt<undefined>[] {
  const root = getWorkspaceRoot();
  const fileBasedPrompts = discoverDocPrompts(root).map((prompt) => ({
    name: `doc/${prompt.name}`,
    description: prompt.description,
    load: async () => prompt.content,
  }));

  const integrationPrompts = CLIENT_INTEGRATIONS.map<InputPrompt<undefined>>((integration) => ({
    name: `integration/${integration.id}`,
    description: `${integration.display} integration guidance`,
    load: async () =>
      `You are coordinating with ${integration.display}. ${integration.instructions}\n\nTools available:\n- document-code\n- apply-code-change\n\nEnsure responses include actionable steps for the client.`,
  }));

  return [...fileBasedPrompts, ...integrationPrompts];
}

function resolveInWorkspace(root: string, targetPath: string): string {
  const resolved = path.isAbsolute(targetPath)
    ? path.normalize(targetPath)
    : path.resolve(root, targetPath);

  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new WorkspaceError(`Path ${targetPath} escapes the workspace root at ${root}`);
  }

  return resolved;
}

async function readWorkspaceFile(root: string, target: string): Promise<string> {
  try {
    const absolute = resolveInWorkspace(root, target);
    return fs.readFileSync(absolute, "utf8" as BufferEncoding);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      await throwUserError(error.message);
    }
    /* istanbul ignore next */
    throw error;
  }
}

function discoverDocPrompts(root: string): DocPrompt[] {
  const discovered: DocPrompt[] = [];

  for (const directory of PROMPT_DIRECTORIES) {
    const promptDir = path.join(root, directory);
    if (!fs.existsSync(promptDir) || !fs.statSync(promptDir).isDirectory()) {
      continue;
    }

    for (const entry of fs.readdirSync(promptDir)) {
      const fullPath = path.join(promptDir, entry);
      if (!fs.statSync(fullPath).isFile()) continue;

      const name = path.parse(entry).name;
      const content = fs.readFileSync(fullPath, "utf8");
      const title = toTitleCase(name.replace(/[-_]/g, " "));
      const description = extractDescription(content, fullPath);

      discovered.push({
        name,
        title,
        description,
        content,
        absolutePath: fullPath,
      });
    }
  }

  const unique = new Map<string, DocPrompt>();
  for (const prompt of discovered) {
    if (!unique.has(prompt.name)) {
      unique.set(prompt.name, prompt);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function selectPrompt(prompts: DocPrompt[], requestedName: string): DocPrompt {
  const direct = prompts.find((prompt) => prompt.name === requestedName);
  if (direct) return direct;

  const fallback = prompts.find((prompt) => prompt.name === DEFAULT_PROMPT_NAME);
  if (fallback) return fallback;

  if (!prompts.length) {
    throw new WorkspaceError("No documentation prompts available");
  }

  return prompts[0];
}

function buildDocumentationPayload({
  filePath,
  fileContent,
  prompt,
  includePrompt,
  includeCode,
  includeMetadata,
  additionalContext,
}: {
  filePath: string;
  fileContent: string;
  prompt: DocPrompt;
  includePrompt: boolean;
  includeCode: boolean;
  includeMetadata: boolean;
  additionalContext?: string;
}): ContentResult {
  const sections: string[] = [];

  if (includeMetadata) {
    sections.push(`# Documentation Request\n- prompt: ${prompt.name}\n- file: ${filePath}`);
  }

  if (includePrompt) {
    sections.push(`## Prompt Guidance (${prompt.title})\n\n${prompt.content.trim()}`);
  }

  if (additionalContext?.trim()) {
    sections.push(`## Additional Context\n\n${additionalContext.trim()}`);
  }

  if (includeCode) {
    sections.push(`## Source\n\n\`\`\`${inferLanguageFromPath(filePath)}\n${fileContent}\n\`\`\``);
  }

  return {
    content: [
      {
        type: "text",
        text: sections.join("\n\n"),
      },
    ],
  } satisfies ContentResult;
}

function extractDescription(content: string, filePath: string): string {
  const firstLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return (
    firstLine?.slice(0, 240) ?? `Documentation prompt loaded from ${path.basename(filePath)}`
  );
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferLanguageFromPath(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".ts":
    case ".tsx":
      return "ts";
    case ".js":
    case ".jsx":
      return "js";
    case ".json":
      return "json";
    case ".md":
      return "md";
    default:
      return "text";
  }
}

export function __resetWorkspaceRoot(root: string) {
  setWorkspaceRoot(root);
}

export { documentCodeSchema, codeChangeSchema };
