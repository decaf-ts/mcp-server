const placeholderTool: any = {
  name: "_template.tool",
  description: "A placeholder tool",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute: async (_input: any, _context: any): Promise<string> => "ok",
};

export const tools = [
  {
    id: "_template.tool",
    title: "template tool",
    description: "A placeholder tool",
    tool: placeholderTool,
  },
] as const;
