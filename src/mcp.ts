// ...existing code...
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { VERSIOn } from "./version";

export type ToolMeta = { title?: string; description?: string } & Record<
  string,
  any
>;
export type PromptMeta = { description?: string; arguments?: any } & Record<
  string,
  any
>;
export type ResourceMeta = { description?: string; uri?: string } & Record<
  string,
  any
>;
export type TemplateMeta = { description?: string } & Record<string, any>;

export class McpServer {
  public server: FastMCP;
  private tools = new Map<string, ToolMeta>();
  private prompts = new Map<string, PromptMeta>();
  private resources = new Map<string, ResourceMeta>();
  private templates = new Map<string, TemplateMeta>();

  constructor(opts?: { name?: string; version?: string }) {
    const name = opts?.name ?? "@decaf-ts/mcp-server";
    const version = opts?.version ?? (VERSIOn || "0.0.0");
    this.server = new FastMCP({ name, version });
    // Register the help tool so clients can introspect capabilities
    this.registerHelpTool();
  }

  registerTool(
    name: string,
    meta: ToolMeta,
    fn: (...args: any[]) => Promise<any>
  ) {
    this.tools.set(name, meta || {});
    // fastmcp expects input/output schemas as zod objects; callers can pass them via meta
    return this.server.registerTool(
      name,
      {
        title: meta.title || name,
        description: meta.description || "",
        inputSchema: meta.inputSchema || { query: z.string().optional() },
        outputSchema: meta.outputSchema || undefined,
      } as any,
      async (args: any) => {
        // delegate to provided fn
        const res = await fn(args);
        return res;
      }
    );
  }

  registerPrompt(
    name: string,
    meta: PromptMeta,
    fn: (args: any) => Promise<any>
  ) {
    this.prompts.set(name, meta || {});
    return this.server.registerPrompt(
      {
        name,
        description: meta.description,
        arguments: meta.arguments || [],
      } as any,
      async (args: any) => fn(args)
    );
  }

  registerResource(name: string, meta: ResourceMeta, fn: () => Promise<any>) {
    this.resources.set(name, meta || {});
    return this.server.registerResource(
      { name, uri: meta.uri || name, description: meta.description } as any,
      async () => fn()
    );
  }

  registerTemplate(name: string, meta: TemplateMeta) {
    this.templates.set(name, meta || {});
  }

  // Programmatic help method used by tests and the registered help tool
  async help(query?: string) {
    if (!query) {
      // Return a summary of available capabilities
      return {
        tools: Array.from(this.tools.keys()),
        prompts: Array.from(this.prompts.keys()),
        resources: Array.from(this.resources.keys()),
        templates: Array.from(this.templates.keys()),
      };
    }

    // support queries like: "tool <name>", "prompt <name>", "resource <name>", "template <name>" or just a name
    const parts = String(query).trim().split(/\s+/);
    if (parts.length === 1) {
      const id = parts[0];
      if (this.tools.has(id))
        return { type: "tool", id, meta: this.tools.get(id) };
      if (this.prompts.has(id))
        return { type: "prompt", id, meta: this.prompts.get(id) };
      if (this.resources.has(id))
        return { type: "resource", id, meta: this.resources.get(id) };
      if (this.templates.has(id))
        return { type: "template", id, meta: this.templates.get(id) };
      return { error: "not_found", query };
    }

    const [kind, ...rest] = parts;
    const id = rest.join(" ");
    switch (kind.toLowerCase()) {
      case "tool":
        return this.tools.has(id)
          ? { type: "tool", id, meta: this.tools.get(id) }
          : { error: "not_found", kind, id };
      case "prompt":
        return this.prompts.has(id)
          ? { type: "prompt", id, meta: this.prompts.get(id) }
          : { error: "not_found", kind, id };
      case "resource":
        return this.resources.has(id)
          ? { type: "resource", id, meta: this.resources.get(id) }
          : { error: "not_found", kind, id };
      case "template":
        return this.templates.has(id)
          ? { type: "template", id, meta: this.templates.get(id) }
          : { error: "not_found", kind, id };
      default:
        return { error: "unknown_query", query };
    }
  }

  private registerHelpTool() {
    // Register a 'help' tool which delegates into this.help
    try {
      this.server.registerTool(
        "help",
        {
          title: "Help",
          description:
            "Lists available tools, prompts, resources and templates. Use 'help <type> <id>' for details.",
          inputSchema: { query: z.string().optional() },
        } as any,
        async (args: any, context?: any) => {
          const q = args?.query;
          const res = await this.help(q);
          // Return ContentResult-like structure expected by fastmcp
          return {
            content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
            structuredContent: res,
          } as any;
        }
      );
    } catch (e) {
      // ignore registration errors in environments where server API differs
      // but keep help available programmatically
    }
  }

  async startStdio() {
    await this.server.start({ transportType: "stdio" });
  }
}

export function createServer(opts?: { name?: string; version?: string }) {
  return new McpServer(opts);
}
