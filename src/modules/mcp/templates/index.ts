import type { TemplateAsset } from "../../../types";

export const templates: TemplateAsset[] = [
  {
    id: "mcp.template.module-readme",
    title: "Module README Template",
    description: "Guides maintainers through documenting a new MCP-aware module.",
    content: `# {{moduleName}} Module

## Purpose
Describe why this module exists and how assistants should use it.

## Assets
- Prompts: {{promptSummary}}
- Resources: {{resourceSummary}}
- Templates: {{templateSummary}}
- Tools: {{toolSummary}}

## Validation
Explain what needs to happen when this module changes (tests, docs, etc.).`,
    placeholders: [
      "moduleName",
      "promptSummary",
      "resourceSummary",
      "templateSummary",
      "toolSummary",
    ],
  },
];
