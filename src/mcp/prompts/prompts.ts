import fs from "fs";
import path from "path";
import type { ContentResult, InputPrompt } from "fastmcp";
import {
  CLIENT_INTEGRATIONS,
  DEFAULT_PROMPT_NAME,
  PROMPT_DIRECTORIES,
} from "../../constants";
import type { DocPrompt } from "../types";
import { getWorkspaceRoot } from "../workspace";
import type { PromptAsset } from "../../types";

export const prompts: InputPrompt<undefined>[] = [];

// Read registered module packages from a runtime global set by modules/index
// This avoids importing moduleRegistry at module-eval time which creates circular imports.
function getRegisteredModulePackages(): any[] {
  return (globalThis as any).__DECAF_MODULE_PACKAGES__ ?? [];
}

const OBJECT_PROMPT_DEPENDENCIES: Record<string, readonly string[]> = {
  module: ["doc", "module"],
  file: ["doc", "file"],
  class: ["doc", "class"],
  function: ["doc", "function"],
  interface: ["doc", "interface"],
  decorator: ["doc", "decorator"],
  constant: ["doc", "constant"],
  "bulk-docs": ["bulk-docs"],
  "bulk-tests": ["bulk-tests"],
  "update-readme": ["update-readme"],
  "repo-setup": ["repo-setup"],
  "release-notes": ["release-notes"],
  "mcp-module": ["mcp-module"],
};

export function getObjectPromptDependencies(): Record<
  string,
  readonly string[]
> {
  return OBJECT_PROMPT_DEPENDENCIES;
}

export function buildPrompts(repoPath: string): InputPrompt<undefined>[] {
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

function summarizePromptContent(
  prompt: DocPrompt,
  headingPrefix: string
): string {
  return [`## ${headingPrefix}`, "", prompt.content.trim()].join("\n");
}

export function buildObjectPrompts(): InputPrompt<undefined>[] {
  const root = getWorkspaceRoot();
  const discovered = discoverDocPrompts(root);
  const promptByName = new Map<string, DocPrompt>();
  for (const prompt of discovered) {
    promptByName.set(prompt.name, prompt);
  }

  const outputs: InputPrompt<undefined>[] = [];
  for (const [objectType, dependencies] of Object.entries(
    OBJECT_PROMPT_DEPENDENCIES
  )) {
    const existing = dependencies
      .map((name) => promptByName.get(name))
      .filter((prompt): prompt is DocPrompt => Boolean(prompt));
    if (!existing.length) continue;

    outputs.push({
      name: `codex/${objectType}`,
      description: `Guidance derived from .codex prompts for ${objectType} tasks.`,
      load: async () => {
        const sections = existing.map((prompt) =>
          summarizePromptContent(prompt, toTitleCase(prompt.name))
        );
        return [`# Codex guidance for ${objectType}`, "", ...sections].join(
          "\n"
        );
      },
    });
  }

  return outputs.sort((a, b) => a.name.localeCompare(b.name));
}

function toInputPrompt(asset: PromptAsset): InputPrompt<undefined> {
  const provenance = asset.provenance ? ` (module: ${asset.provenance})` : "";
  return {
    name: asset.id,
    description: `${asset.description ?? asset.title}${provenance}`,
    load: async () => asset.load(),
  };
}

function buildModulePrompts(): InputPrompt<undefined>[] {
  const pkgs = getRegisteredModulePackages();
  const assets: PromptAsset[] = pkgs.flatMap((p: any) => p.prompts ?? []);
  return assets.map(toInputPrompt);
}

export function refreshPrompts(repoPath?: string): InputPrompt<undefined>[] {
  const docPrompts = buildDocPrompts();
  const objectPrompts = buildObjectPrompts();
  const repoPrompts = repoPath ? buildPrompts(repoPath) : [];
  const modulePrompts = buildModulePrompts();
  prompts.splice(
    0,
    prompts.length,
    ...docPrompts,
    ...objectPrompts,
    ...repoPrompts,
    ...modulePrompts
  );
  return prompts;
}

export function discoverDocPrompts(root: string): DocPrompt[] {
  const discovered: DocPrompt[] = [];

  for (const directory of PROMPT_DIRECTORIES) {
    const promptDir = path.join(root, directory);
    // debug logging to help tests diagnose prompt discovery

    console.debug("[discoverDocPrompts] checking", promptDir);
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

export function selectPrompt(
  promptList: DocPrompt[],
  requestedName: string
): DocPrompt {
  const direct = promptList.find((prompt) => prompt.name === requestedName);
  if (direct) return direct;

  const fallback = promptList.find(
    (prompt) => prompt.name === DEFAULT_PROMPT_NAME
  );
  if (fallback) return fallback;

  if (!promptList.length) {
    throw new Error("No documentation prompts available");
  }

  return promptList[0];
}

export function buildDocumentationPayload({
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

export { DEFAULT_PROMPT_NAME };
export type { DocPrompt };
