import type { TemplateAsset } from "../../../types";

export const templates: TemplateAsset[] = [
  {
    id: "decoration.template.decorator",
    title: "Decorator Boilerplate",
    description: "Scaffold describing the shape of a new decorator function.",
    content: `import { createDecorator } from "@decaf-ts/decoration";

export const {{decoratorName}} = createDecorator({
  target: "{{target}}",
  description: "{{description}}",
  run(context) {
    // TODO: implement decorator behavior
  },
});`,
    placeholders: ["decoratorName", "target", "description"],
  },
];
