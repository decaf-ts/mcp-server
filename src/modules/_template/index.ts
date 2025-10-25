import { prompts } from "./prompts/index";
import { resources } from "./resources/index";
import { templates } from "./templates/index";
import { tools } from "./tools/index";
export { prompts } from "./prompts/index";
export { resources } from "./resources/index";
export { templates } from "./templates/index";
export { tools } from "./tools/index";
export const modulePackage = {
  name: "_template",
  prompts,
  resources,
  templates,
  tools,
} as const;
