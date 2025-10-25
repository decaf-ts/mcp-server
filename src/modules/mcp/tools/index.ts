const describeModulesTool: any = {
  name: "describe-modules",
  description:
    "Summarize the purpose of Decaf MCP modules for assistant operators.",
  // Minimal execute implementation to return a text result
  execute: async (): Promise<string> =>
    "Modules contribute prompts, resources, templates, and tools that the registry exposes to FASTMCP clients.",
};

export const tools = [
  {
    id: "mcp.tool.describe-modules",
    title: "Describe MCP Modules",
    description: "Explains how module exports feed into the FASTMCP server.",
    tool: describeModulesTool,
  },
];
