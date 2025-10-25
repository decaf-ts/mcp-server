import type { PromptAsset } from "../../../types";

export const prompts: PromptAsset[] = [
  {
    id: "mcp.prompt.module-catalog",
    title: "Decaf MCP Module Catalog",
    description: "Summarizes the modules contributing prompts/resources/templates/tools to FASTMCP.",
    load: async () =>
      "Use the module catalog tool to enumerate available module assets before fulfilling assistant requests.",
  },
];
