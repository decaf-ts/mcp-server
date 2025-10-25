// NOTE: Do not import `fastmcp` at the top-level. Some dist files in node_modules
// use `import.meta` and are ESM-only. Loading them unconditionally breaks Jest's
// runtime transform in some environments. We dynamically import inside startStdio.
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
  public server: any | undefined;
  private queuedTools: Array<{
    name: string;
    meta: ToolMeta;
    fn: (...args: any[]) => Promise<any>;
  }> = [];
  private queuedPrompts: Array<{
    name: string;
    meta: PromptMeta;
    fn: (args: any) => Promise<any>;
  }> = [];
  private queuedResources: Array<{
    name: string;
    meta: ResourceMeta;
    fn: () => Promise<any>;
  }> = [];

  private tools = new Map<string, ToolMeta>();
  private prompts = new Map<string, PromptMeta>();
  private resources = new Map<string, ResourceMeta>();
  private templates = new Map<string, TemplateMeta>();

  private name: string;
  private version: string;

  constructor(opts?: { name?: string; version?: string }) {
    this.name = opts?.name ?? "@decaf-ts/mcp-server";
    this.version = opts?.version ?? (VERSIOn || "0.0.0");
    // do NOT initialize FastMCP synchronously here
  }

  registerTool(
    name: string,
    meta: ToolMeta,
    fn: (...args: any[]) => Promise<any>
  ) {
    this.tools.set(name, meta || {});
    if (this.server && typeof this.server.registerTool === "function") {
      return this.server.registerTool(
        name,
        {
          title: meta.title || name,
          description: meta.description || "",
          inputSchema: meta.inputSchema || {
            query: (z as any).string().optional(),
          },
          outputSchema: meta.outputSchema || undefined,
        } as any,
        async (args: any) => {
          const res = await fn(args);
          return res;
        }
      );
    }
    // queue for later registration when server starts
    this.queuedTools.push({ name, meta, fn });
    // return a placeholder object to satisfy call sites
    return {
      disable: () => {},
    } as any;
  }

  registerPrompt(
    name: string,
    meta: PromptMeta,
    fn: (args: any) => Promise<any>
  ) {
    this.prompts.set(name, meta || {});
    if (this.server && typeof this.server.registerPrompt === "function") {
      return this.server.registerPrompt(
        {
          name,
          description: meta.description,
          arguments: meta.arguments || [],
        } as any,
        async (args: any) => fn(args)
      );
    }
    this.queuedPrompts.push({ name, meta, fn });
    return { disable: () => {} } as any;
  }

  registerResource(name: string, meta: ResourceMeta, fn: () => Promise<any>) {
    this.resources.set(name, meta || {});
    if (this.server && typeof this.server.registerResource === "function") {
      return this.server.registerResource(
        { name, uri: meta.uri || name, description: meta.description } as any,
        async () => fn()
      );
    }
    this.queuedResources.push({ name, meta, fn });
    return { disable: () => {} } as any;
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

  private registerHelpOnServer() {
    if (!this.server || typeof this.server.registerTool !== "function") return;
    try {
      this.server.registerTool(
        "help",
        {
          title: "Help",
          description:
            "Lists available tools, prompts, resources and templates. Use 'help <type> <id>' for details.",
          inputSchema: { query: (z as any).string().optional() },
        } as any,
        async (args: any) => {
          const q = args?.query;
          const res = await this.help(q);
          return {
            content: [{ type: "text", text: JSON.stringify(res, null, 2) }],
            structuredContent: res,
          } as any;
        }
      );
    } catch {
      // ignore
    }
  }

  async startStdio() {
    // Dynamically import fastmcp to avoid loading ESM node_modules at test parse time
    const fastmcp = await import("fastmcp");
    const FastMCP = fastmcp.FastMCP || (fastmcp as any).default || fastmcp;
    this.server = new FastMCP({
      name: this.name,
      version: this.version as any,
    });

    // register queued items
    for (const t of this.queuedTools) {
      this.server.registerTool(
        t.name,
        {
          title: t.meta.title || t.name,
          description: t.meta.description || "",
          inputSchema: t.meta.inputSchema || {
            query: (z as any).string().optional(),
          },
        } as any,
        async (args: any) => t.fn(args)
      );
    }
    for (const p of this.queuedPrompts) {
      this.server.registerPrompt(
        {
          name: p.name,
          description: p.meta.description,
          arguments: p.meta.arguments || [],
        } as any,
        async (args: any) => p.fn(args)
      );
    }
    for (const r of this.queuedResources) {
      this.server.registerResource(
        {
          name: r.name,
          uri: r.meta.uri || r.name,
          description: r.meta.description,
        } as any,
        async () => r.fn()
      );
    }

    // Register help tool on actual server
    this.registerHelpOnServer();

    await this.server.start({ transportType: "stdio" });
  }
}

export function createServer(opts?: { name?: string; version?: string }) {
  return new McpServer(opts);
}

export { default } from "./fastmcp/index";
export {
  tools,
  setWorkspaceRoot,
  getWorkspaceRoot,
  buildResourceTemplates,
  buildDocPrompts,
} from "./fastmcp/index";
