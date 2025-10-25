import {
  buildCodexPromptTemplates,
  codexPromptTemplates,
} from "./codex-templates";
import {
  buildDecorationResourceTemplates,
  decorationResourceTemplates,
} from "./resource-templates";
import {
  buildWorkspaceResourceTemplates,
  workspaceResourceTemplates,
} from "./workspace-templates";
import type { TemplateAsset } from "../../types";
import { moduleRegistry } from "../moduleRegistry";

export {
  buildCodexPromptTemplates,
  codexPromptTemplates,
} from "./codex-templates";
export {
  buildDecorationResourceTemplates,
  decorationResourceTemplates,
} from "./resource-templates";
export {
  buildWorkspaceResourceTemplates,
  workspaceResourceTemplates,
} from "./workspace-templates";

export function buildResourceTemplates() {
  const moduleTemplates = moduleRegistry.listTemplates().map((template) => ({
    name: template.id,
    description: template.description ?? template.title,
    mimeType: "text/markdown",
    uriTemplate: `module-template://${template.id}`,
    arguments: (template.placeholders ?? []).map((name) => ({
      name,
      description: `Value for ${name}`,
      required: true,
    })),
    load: async () => ({
      text:
        typeof (template as any).content === "string"
          ? (template as any).content
          : `# ${template.description ?? template.title ?? template.id}\n\nNo template content available for ${template.id}`,
    }),
  }));

  const all = [
    ...buildWorkspaceResourceTemplates(),
    ...buildCodexPromptTemplates(),
    ...buildDecorationResourceTemplates(),
    ...moduleTemplates,
  ];

  // Normalise all loaders to always return { text: string }
  function normaliseResult(res: any) {
    if (res == null) return { text: "" };
    if (typeof res === "string") return { text: res };
    if (typeof res.text === "string") return res;
    // handle legacy ContentResult shapes with content or content array
    if (Array.isArray(res.content)) {
      const parts = res.content
        .map((c: any) => (c && typeof c.text === "string" ? c.text : String(c)))
        .join("\n");
      return { text: parts };
    }
    if (res.content && typeof res.content.text === "string") {
      return { text: res.content.text };
    }
    // fallback: stringify
    try {
      return { text: JSON.stringify(res) };
    } catch {
      return { text: String(res) };
    }
  }

  return all.map((t) => ({
    ...t,
    load: async (args: any) => {
      const raw = await (t.load as any)(args);
      return normaliseResult(raw);
    },
  }));
}

export const templateList = buildResourceTemplates();
