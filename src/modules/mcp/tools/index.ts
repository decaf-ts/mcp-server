import type { Tool } from "fastmcp";
import type { ToolAsset } from "../../../types";

const describeModulesTool: Tool<undefined, undefined> = {
  name: "describe-modules",
  description: "Summarize the purpose of Decaf MCP modules for assistant operators.",
  inputSchema: { type: "object", properties: {} },
  outputSchema: {
    type: "object",
    properties: {
      summary: { type: "string" },
    },
  },
  handler: async () => ({
    content: {
      type: "text",
      text: "Modules contribute prompts, resources, templates, and tools that the registry exposes to FASTMCP clients.",
    },
  }),
};

export const tools: ToolAsset[] = [
  {
    id: "mcp.tool.describe-modules",
    title: "Describe MCP Modules",
    description: "Explains how module exports feed into the FASTMCP server.",
    tool: describeModulesTool,
  },
];
