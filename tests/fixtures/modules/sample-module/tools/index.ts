import type { Tool } from "fastmcp";
import type { ToolAsset } from "../../../../src/types";

const sampleTool: Tool<undefined, undefined> = {
  name: "sample-module.tool.echo",
  description: "Echoes the provided message for testing.",
  inputSchema: {
    type: "object",
    properties: {
      message: {
        type: "string",
      },
    },
    required: ["message"],
  },
  outputSchema: {
    type: "object",
    properties: {
      echoed: {
        type: "string",
      },
    },
  },
  handler: async (args: { message: string }) => ({
    content: {
      type: "text",
      text: `echo:${args.message}`,
    },
  }),
};

export const tools: ToolAsset[] = [
  {
    id: "sample-module.tool.echo",
    title: "Sample Echo Tool",
    description: "Test tool ensuring module tool exports are wired correctly.",
    tool: sampleTool,
  },
];
