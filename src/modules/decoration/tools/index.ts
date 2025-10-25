import type { Tool } from "fastmcp";
import type { ToolAsset } from "../../../types";

const summarizeDecoratorsTool: Tool<undefined, undefined> = {
  name: "summarize-decorator-patterns",
  description: "Summaries of decorator extension points in Decaf projects.",
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
      text: "Use decorator factories in @decaf-ts/decoration to extend CLI commands, metadata, and validation.",
    },
  }),
};

export const tools: ToolAsset[] = [
  {
    id: "decoration.tool.summarize",
    title: "Summarize Decorator Patterns",
    description: "Provides a refresher on how to extend the decoration module.",
    tags: ["decoration"],
    tool: summarizeDecoratorsTool,
  },
];
