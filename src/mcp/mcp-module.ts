import type { FastMCP } from "fastmcp";
import { PACKAGE_NAME as PKG, VERSION as V } from "../metadata";
import {
  buildDocPrompts,
  buildPrompts,
  buildDocumentationPayload,
  discoverDocPrompts,
  loadPrompts,
  promptList,
  refreshPrompts,
  selectPrompt,
  DEFAULT_PROMPT_NAME,
} from "./prompts";
import { resources } from "./resources";
import {
  buildDecorationResourceTemplates,
  buildResourceTemplates,
  decorationResourceTemplates,
  templateList,
  workspaceResourceTemplates,
} from "./templates";
import { toolList, tools } from "./tools";
import {
  __resetWorkspaceRoot,
  getWorkspaceRoot,
  setWorkspaceRoot,
} from "./workspace";

export function enrich(mcp: FastMCP): FastMCP {
  const promptEntries = loadPrompts();
  for (const prompt of promptEntries) {
    mcp.addPrompt(prompt as any);
  }

  for (const tool of toolList) {
    mcp.addTool(tool as any);
  }

  const templates = buildResourceTemplates();
  for (const template of templates) {
    mcp.addResourceTemplate(template as any);
  }

  for (const resource of resources) {
    mcp.addResource(resource as any);
  }

  return mcp;
}

export default enrich;
export const PACKAGE_NAME = PKG;
export const VERSION = V;

export {
  tools,
  toolList,
  buildDocPrompts,
  buildPrompts,
  buildDecorationResourceTemplates,
  buildResourceTemplates,
  buildDocumentationPayload,
  decorationResourceTemplates,
  discoverDocPrompts,
  DEFAULT_PROMPT_NAME,
  promptList,
  refreshPrompts,
  resources,
  selectPrompt,
  templateList,
  workspaceResourceTemplates,
  getWorkspaceRoot,
  setWorkspaceRoot,
  __resetWorkspaceRoot,
};
