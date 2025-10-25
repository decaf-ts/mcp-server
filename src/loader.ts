import { LoggedClass } from "@decaf-ts/logging";
import { PromptDefinition, ResourceDefinition, ToolDefinition } from "./types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export class Loader extends LoggedClass {
  constructor() {
    super();
  }

  private load(
    server: McpServer,
    type: "tools" | "resources" | "prompts",
    items: (ResourceDefinition | PromptDefinition<any> | ToolDefinition)[]
  ) {
    for (const item of items) {
      switch (type) {
        case "tools": {
          const tool = item as ToolDefinition;
          try {
            server.registerTool(
              tool.name,
              {
                title: tool.title,
                description: tool.description,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
                annotations: tool.annotations,
                _meta: tool._meta,
              },
              tool.cb as any
            );
          } catch (e: any) {
            throw new Error(`failed to load ${tool.name}: ${e.message}`);
          }
          break;
        }
        case "prompts": {
          const prompt = item as PromptDefinition<any>;
          try {
            server.registerPrompt(
              prompt.name,
              {
                title: prompt.title,
                description: prompt.description,
                argsSchema: prompt.argsSchema,
              },
              prompt.cb as any
            );
          } catch (e: any) {
            throw new Error(`failed to load ${prompt.name}: ${e.message}`);
          }
          break;
        }
        case "resources": {
          const resource = item as ResourceDefinition;
          try {
            server.registerResource(
              resource.name,
              resource.uriOrTemplate,
              resource.config,
              resource.cb as any
            );
          } catch (e: any) {
            throw new Error(`failed to load ${resource.name}: ${e.message}`);
          }
          break;
        }
        default:
          throw new Error(`Unknown load type: ${type}`);
      }
    }
  }

  loadTools(server: McpServer, ...tools: ToolDefinition[]) {
    return this.load(server, "tools", tools);
  }

  loadResources(server: McpServer, ...resources: ResourceDefinition[]) {
    this.load(server, "resources", resources);
  }

  loadPrompts(server: McpServer, ...prompts: PromptDefinition<any>[]) {
    this.load(server, "prompts", prompts);
  }
}
