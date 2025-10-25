import type { Tool } from 'fastmcp';
import { buildAnalyzeRepositoryTool, buildEnumerateCapabilitiesTool, buildPlanFeatureTool } from '../../../mcp/tools/tools';
export const tools = [
  { id: 'decoration.analyze', title: 'Analyze decoration', description: 'Analyze the target repository', tool: buildAnalyzeRepositoryTool() },
  { id: 'decoration.enumerate', title: 'Enumerate capabilities for decoration', description: 'Enumerate capabilities', tool: buildEnumerateCapabilitiesTool() },
  { id: 'decoration.plan', title: 'Plan features for decoration', description: 'Plan feature implementation', tool: buildPlanFeatureTool() },
] as const;
