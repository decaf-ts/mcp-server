import { FastMCP } from "fastmcp";
import { loadPrompts, promptList } from "./prompts";
import { toolList } from "./tools";
import { resources } from "./resources";
import { buildResourceTemplates } from "./templates";

export * from "./mcp-module";
export { default } from "./mcp-module";

export { validateModules } from "./validation";
export { aggregateModules, aggregateModulesSync } from "./aggregateModules";
export { EnrichCoreWithAggregation } from "./fastmcp-wiring";

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
