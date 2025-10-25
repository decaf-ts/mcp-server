import type { ContentResult, FastMCP, Tool } from "fastmcp";

/**
 * @description Function type for Decaf MCP modules
 * @summary Defines the signature for MCP module functions that each Decaf module must export under the MCP_FILE_NAME file
 * The function should return a Server object or a Promise that resolves to a Server object
 *
 * @typedef {Function} McpModule
 * @return {Server|Promise<Server>} A Command object or Promise that resolves to a Server object
 * @memberOf module:CLI
 */
export type McpModule = {
  enrich(mcp: FastMCP): FastMCP | Promise<FastMCP>;
  PACKAGE_NAME: string;
  VERSION: string;
};

export type ModuleStatus = "active" | "disabled";

export interface BaseAsset {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  provenance?: string;
}

export interface PromptAsset extends BaseAsset {
  load: () => Promise<string> | string;
}

export interface ResourceAsset extends BaseAsset {
  uri: string;
  mimeType: string;
  load: () => Promise<ContentResult> | ContentResult;
}

export interface TemplateAsset extends BaseAsset {
  content: string;
  placeholders?: string[];
}

export interface ToolAsset extends BaseAsset {
  tool: Tool<unknown, unknown>;
}

export interface ModuleExportPackage {
  name: string;
  status?: ModuleStatus;
  version?: string;
  lastUpdated?: string;
  prompts: PromptAsset[];
  resources: ResourceAsset[];
  templates: TemplateAsset[];
  tools: ToolAsset[];
}

export type ValidationIssueType =
  | "missing-folder"
  | "missing-export"
  | "duplicate-id"
  | "empty-asset"
  | "runtime-failure";

export interface ValidationIssue {
  type: ValidationIssueType;
  module: string;
  detail: string;
  severity: "error" | "warning";
}
