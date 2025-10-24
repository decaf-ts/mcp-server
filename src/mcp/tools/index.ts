import { decoratorTools } from "../decorator-tools";
import {
  applyCodeChangeTool,
  documentCodeTool,
  toolList as coreToolList,
} from "./tools";

export * from "./tools";

export const toolList = coreToolList;
export const decoratorToolList = Object.values(decoratorTools);
const [analyzeRepositoryTool, enumerateCapabilitiesTool, planFeatureTool] =
  coreToolList;

export const tools = {
  analyzeRepositoryTool,
  enumerateCapabilitiesTool,
  planFeatureTool,
  documentCodeTool,
  applyCodeChangeTool,
  ...decoratorTools,
};

export { decoratorTools };
