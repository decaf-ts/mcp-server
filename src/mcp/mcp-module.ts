import fs from "fs";
import path from "path";
import type { FastMCP, ContentResult, InputPrompt, Tool } from "fastmcp";
import { applyPatch, createTwoFilesPatch } from "diff";
import { z } from "zod";
import { PACKAGE_NAME as PKG, VERSION as V } from "../../metadata";
import { decoratorTools } from "./decorator-tools";

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
      userErrorCtor = (mod as { UserError: new (message: string) => Error })
        .UserError;
    } catch {
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
      description:
        "Expose workspace files to Visual Studio Code via vscode:// URIs",
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
      description:
        "Expose workspace files to GitHub Copilot via copilot:// URIs",
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

  const integrationPrompts = CLIENT_INTEGRATIONS.map<InputPrompt<undefined>>(
    (integration) => ({
      name: `integration/${integration.id}`,
      description: `${integration.display} integration guidance`,
      load: async () =>
        `You are coordinating with ${integration.display}. ${integration.instructions}\n\nTools available:\n- document-code\n- apply-code-change\n\nEnsure responses include actionable steps for the client.`,
    })
  );

  return [...fileBasedPrompts, ...integrationPrompts];
}

function resolveInWorkspace(root: string, targetPath: string): string {
  const resolved = path.isAbsolute(targetPath)
    ? path.normalize(targetPath)
    : path.resolve(root, targetPath);

  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new WorkspaceError(
      `Path ${targetPath} escapes the workspace root at ${root}`
    );
  }

  return resolved;
}

async function readWorkspaceFile(
  root: string,
  target: string
): Promise<string> {
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

  return Array.from(unique.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function selectPrompt(prompts: DocPrompt[], requestedName: string): DocPrompt {
  const direct = prompts.find((prompt) => prompt.name === requestedName);
  if (direct) return direct;

  const fallback = prompts.find(
    (prompt) => prompt.name === DEFAULT_PROMPT_NAME
  );
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
    sections.push(
      `# Documentation Request\n- prompt: ${prompt.name}\n- file: ${filePath}`
    );
  }

  if (includePrompt) {
    sections.push(
      `## Prompt Guidance (${prompt.title})\n\n${prompt.content.trim()}`
    );
  }

  if (additionalContext?.trim()) {
    sections.push(`## Additional Context\n\n${additionalContext.trim()}`);
  }

  if (includeCode) {
    sections.push(
      `## Source\n\n\`\`\`${inferLanguageFromPath(filePath)}\n${fileContent}\n\`\`\``
    );
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
    firstLine?.slice(0, 240) ??
    `Documentation prompt loaded from ${path.basename(filePath)}`
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
