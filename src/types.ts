import { ZodErrorMap, ZodOptional, ZodRawShape, ZodType } from "zod";
import { Resource, ToolAnnotations } from "@modelcontextprotocol/sdk/types";
import {
  PromptCallback,
  ReadResourceTemplateCallback,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp";

interface ZodTypeDef {
  errorMap?: ZodErrorMap | undefined;
  description?: string | undefined;
}

export type PromptExport = {
  id: string;
  title: string;
  load: (...args: any[]) => any;
};

export type ModuleExportPackage = {
  name: string;
  prompts?: PromptExport[];
  resources?: any[];
  templates?: any[];
  tools?: any[];
};

export type Definition = {
  name: string;
  title: string;
  description: string;
};

export type ResourceDefinition = Definition & {
  uriOrTemplate: string;
  config: Omit<Resource, "uri" | "name">;
  cb: ReadResourceTemplateCallback;
};

type PromptArgsRawShape = {
  // @ts-expect-error zod shenanigans
  [k: string]:
    | ZodType<string, ZodTypeDef, string>
    | ZodOptional<ZodType<string, ZodTypeDef, string>>;
};

export type PromptDefinition<Args extends PromptArgsRawShape> = Definition & {
  argsSchema?: Args;
  // @ts-expect-error override shenanigans
  cb: PromptCallback<Args>;
};

export type ToolDefinition<
  InputArgs extends ZodRawShape | undefined = undefined,
  OutputArgs extends ZodRawShape = any,
> = Definition & {
  inputSchema: InputArgs;
  outputSchema: OutputArgs;
  annotations: ToolAnnotations;
  _meta: Record<string, unknown>;
  // @ts-expect-error override shenanigans
  cb: ToolCallback<InputArgs>;
};
