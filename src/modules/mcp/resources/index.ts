import type { ResourceAsset } from "../../../types";

export const resources: ResourceAsset[] = [
  {
    id: "mcp.resource.registry-overview",
    title: "Module Registry Overview",
    description: "Explains how the ModuleRegistry aggregates module exports into FASTMCP catalogs.",
    uri: "decaf://mcp/module-registry",
    mimeType: "text/markdown",
    load: async () => ({
      text: [
        "# Module Registry",
        "",
        "The Decaf MCP server aggregates prompts, resources, templates, and tools from every module under src/modules.",
        "Validators ensure each module contains the canonical folder layout before the registry loads it.",
      ].join("\n"),
      mimeType: "text/markdown",
    }),
  },
];
