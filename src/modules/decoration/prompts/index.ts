import path from "node:path";
import { readWorkspaceFile, getWorkspaceRoot } from "../../../mcp/workspace";
import type { PromptAsset } from "../../../types";

export const prompts: PromptAsset[] = [
  {
    id: "decoration.prompt.guide",
    title: "Decoration Module Overview",
    description:
      "Summarizes the decoration helpers available in Decaf projects for quick onboarding.",
    load: async () => {
      const root = getWorkspaceRoot();
      const content = await readWorkspaceFile(
        root,
        path.join("workdocs", "tutorials", "For Developers.md")
      );
      return [
        "# Decoration Module Overview",
        "",
        "Use the decoration builders exported from @decaf-ts/decoration to extend CLI and server features.",
        "Relevant onboarding excerpt:",
        content.slice(0, 1000),
      ].join("\n");
    },
  },
];
