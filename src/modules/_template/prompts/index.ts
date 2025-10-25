export const prompts = [
  {
    id: "_template.readme",
    title: "Template README",
    description: "A README prompt for module template",
    load: () => "Template prompt content",
  },
] as const;
