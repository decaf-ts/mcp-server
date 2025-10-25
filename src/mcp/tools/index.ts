import { decoratorTools } from "../decorator-tools";
import { moduleRegistry } from "../moduleRegistry";
import {
  applyCodeChangeTool,
  documentCodeTool,
  toolList as coreToolList,
} from "./tools";
import {
  coverageEnforcerTool,
  documentObjectTool,
  readmeImprovementTool,
} from "./codex-tools";

export * from "./tools";
export * from "./codex-tools";
export * from "./generateMcpModule";

const codexToolList = [
  documentObjectTool,
  coverageEnforcerTool,
  readmeImprovementTool,
];

const moduleToolList = moduleRegistry.listTools().map((asset) => asset.tool as any);

export const toolList = [...coreToolList, ...codexToolList, ...moduleToolList];
export const decoratorToolList = Object.values(decoratorTools);
const [
  analyzeRepositoryTool,
  enumerateCapabilitiesTool,
  planFeatureTool,
  documentCodeToolRef,
  applyCodeChangeToolRef,
] = coreToolList;

export const tools = {
  analyzeRepositoryTool,
  enumerateCapabilitiesTool,
  planFeatureTool,
  documentCodeTool: documentCodeToolRef,
  applyCodeChangeTool: applyCodeChangeToolRef,
  documentObjectTool,
  coverageEnforcerTool,
  readmeImprovementTool,
  ...decoratorTools,
};

export { decoratorTools };