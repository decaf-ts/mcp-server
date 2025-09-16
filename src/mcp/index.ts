import { createOrUpdateModelTool } from "./tools/model";
import { addAttributeTool, removeAttributeTool } from "./tools/attributes";
import { applyDecoratorTool, removeDecoratorTool } from "./tools/decorators";
import { scaffoldValidatorTool } from "./tools/validators";
import { scaffoldSerializerTool } from "./tools/serializers";
import { scaffoldHashingTool } from "./tools/hashing";

export const tools = {
  createOrUpdateModelTool,
  addAttributeTool,
  removeAttributeTool,
  applyDecoratorTool,
  removeDecoratorTool,
  scaffoldValidatorTool,
  scaffoldSerializerTool,
  scaffoldHashingTool,
};
