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
  return [
    ...buildWorkspaceResourceTemplates(),
    ...buildCodexPromptTemplates(),
    ...buildDecorationResourceTemplates(),
  ];
}

export const templateList = buildResourceTemplates();
