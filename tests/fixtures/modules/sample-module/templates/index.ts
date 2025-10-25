import type { TemplateAsset } from "../../../../src/types";

export const templates: TemplateAsset[] = [
  {
    id: "sample-module.template.scaffold",
    title: "Sample Scaffolding Template",
    description: "Provides boilerplate text for module scaffolding tests.",
    content: "Sample template with {{placeholder}}",
    placeholders: ["placeholder"],
  },
];
