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
    load: async () => ({ text: template.content }),
  }));

  return [
    ...buildWorkspaceResourceTemplates(),
    ...buildCodexPromptTemplates(),
    ...buildDecorationResourceTemplates(),
    ...moduleTemplates,
  ];
}

export const templateList = buildResourceTemplates();
