import type { PromptAsset } from "../../../../src/types";

export const prompts: PromptAsset[] = [
  {
    id: "sample-module.prompt.overview",
    title: "Sample Module Overview",
    description: "Explains how the sample module contributes prompts during tests.",
    load: () => "Sample prompt content",
  },
];
