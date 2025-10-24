import path from "path";
import fs from "fs";
import { getWorkspaceRoot, resolveInWorkspace } from "../workspace";
import type { PromptResourceTemplate } from "../types";

export const codexPromptTemplates: PromptResourceTemplate[] = [];

export function buildCodexPromptTemplates(): PromptResourceTemplate[] {
  const root = getWorkspaceRoot();
  const templates: PromptResourceTemplate[] = [
    {
      name: "codex-prompt",
      description:
        "Load a .codex prompt file by name (without extension) as markdown.",
      uriTemplate: "codex-prompt://{name}",
      mimeType: "text/markdown",
      arguments: [
        {
          name: "name",
          description:
            "Name of the prompt file inside .codex/prompts (without .md).",
          required: true,
        },
      ],
      load: async ({ name }) => {
        const promptPath = resolveInWorkspace(
          root,
          path.join(".codex", "prompts", `${name}.md`)
        );
        if (!fs.existsSync(promptPath)) {
          throw new Error(`Prompt .codex/prompts/${name}.md not found`);
        }
        const text = fs.readFileSync(promptPath, "utf8");
        return { text, uri: `codex-prompt:///${name}` };
      },
    },
  ];

  codexPromptTemplates.splice(0, codexPromptTemplates.length, ...templates);
  return codexPromptTemplates;
}
