import type { InputPrompt } from "fastmcp";

export function buildPrompts(repoPath: string): InputPrompt<undefined>[] {
  return [
    {
      name: "decoration-overview",
      description:
        "High-level guidance on using the decoration library: key exports, decorators, and common workflows.",
      load: async () =>
        `You are assisting with the Decaf.ts decoration module located at ${repoPath}. Prefer using exported builders and decorators over ad-hoc patterns.\n\nProvide a concise, actionable overview of how to use the decoration APIs for extending and overriding behaviors.`,
    },
  ];
}
