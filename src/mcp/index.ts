import { FastMCP } from "fastmcp";
import { loadPrompts, promptList } from "./prompts/index";
import { toolList } from "./tools/index";
import { resources } from "./resources/index";
import { buildResourceTemplates } from "./templates/index";

export * from "./mcp-module";
export { default } from "./mcp-module";

export { validateModules } from "./validation";
export { aggregateModules, aggregateModulesSync } from "./aggregateModules";
export { EnrichCoreWithAggregation } from "./fastmcp-wiring";

// re-export helpers used by tests and other modules
export { buildDocPrompts } from "./prompts/index";
export { buildResourceTemplates } from "./templates/index";

export function EnrichCore(server: FastMCP) {
  loadPrompts();
  for (const prompt of promptList) {
    server.addPrompt(prompt as any);
  }
  for (const tool of toolList) {
    server.addTool(tool as any);
  }
  for (const resource of resources) {
    server.addResource(resource as any);
  }
  const templates = buildResourceTemplates();
  for (const template of templates) {
    server.addResourceTemplate(template as any);
  }
}
