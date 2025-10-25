import { moduleRegistry } from "../moduleRegistry";
import {
  coverageEnforcerTool,
  documentObjectTool,
  readmeImprovementTool,
} from "./codex-tools";
import { decoratorTools } from "../decorator-tools";
const codexToolList = [
  documentObjectTool,
  coverageEnforcerTool,
  readmeImprovementTool,
];

import { toolList as coreToolList } from "./tools";

const moduleToolList = moduleRegistry
  .listTools()
  .map((asset) => asset.tool as any);

export const toolList = [...coreToolList, ...codexToolList, ...moduleToolList];
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
