import path from "node:path";
import { readWorkspaceFile, getWorkspaceRoot } from "../../../mcp/workspace";
import type { ResourceAsset } from "../../../types";

export const resources: ResourceAsset[] = [
  {
    id: "decoration.resource.component-list",
    title: "Decoration Components Reference",
    description: "Lists the component files that decorators typically extend.",
    uri: "decaf://decoration/components",
    mimeType: "text/markdown",
    load: async () => ({
      text: await readWorkspaceFile(
        getWorkspaceRoot(),
        path.join("workdocs", "tutorials", "Decoration.md")
      ).catch(() => "Documentation pending for decoration components."),
      mimeType: "text/markdown",
    }),
  },
];
