import { aggregateModules } from "./aggregateModules";
import { loadPrompts, promptList } from "./prompts/index";
import { toolList } from "./tools/index";
import { resources } from "./resources/index";
import { buildResourceTemplates } from "./templates/index";

export type FastMCPLike = {
  addPrompt: (p: any) => void;
  addTool: (t: any) => void;
  addResource: (r: any) => void;
  addResourceTemplate: (t: any) => void;
};

/**
 * Aggregate module assets and register them on the provided FastMCP-like server.
 * Falls back to built-in lists if aggregation yields none.
 */
export async function EnrichCoreWithAggregation(
  server: FastMCPLike,
  repoRoot = process.cwd()
) {
  // First register built-in prompts/tools/resources/templates (legacy behavior)
  try {
    loadPrompts();
    for (const prompt of promptList) server.addPrompt(prompt as any);
  } catch (e) {
    // ignore if loadPrompts not available or fails
  }

  try {
    for (const tool of toolList) server.addTool(tool as any);
  } catch (e) {}

  try {
    for (const resource of resources) server.addResource(resource as any);
  } catch (e) {}

  try {
    const templates = buildResourceTemplates();
    for (const template of templates)
      server.addResourceTemplate(template as any);
  } catch (e) {}

  // Now aggregate modules and register aggregated assets with provenance
  const agg = await aggregateModules(repoRoot);

  for (const p of agg.prompts) {
    server.addPrompt(p);
  }
  for (const t of agg.tools) {
    server.addTool(t);
  }
  for (const r of agg.resources) {
    server.addResource(r);
  }
  for (const tpl of agg.templates) {
    server.addResourceTemplate(tpl);
  }

  // return aggregation summary for calling tests/CI
  return {
    modulesChecked: agg.prompts.concat(agg.tools).length,
    conflicts: agg.conflicts,
  };
}
