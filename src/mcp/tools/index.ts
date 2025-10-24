import { decoratorTools } from "../decorator-tools";
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

const codexToolList = [
  documentObjectTool,
  coverageEnforcerTool,
  readmeImprovementTool,
];

export const toolList = [...coreToolList, ...codexToolList];
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
