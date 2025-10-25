// ...existing code...
export class FastMCP {
  public name: string;
  public version: string;
  public prompts: any[] = [];
  public tools: any[] = [];
  public resources: any[] = [];
  public resourceTemplates: any[] = [];

  constructor(opts: { name?: string; version?: string } = {}) {
    this.name = opts.name || "local-fastmcp";
    this.version = opts.version || "0.0.0";
  }

  registerTool(name: string, meta: any, fn: any) {
    const tool = { id: name, ...meta, fn };
    this.tools.push(tool);
    return tool;
  }

  registerPrompt(obj: any, fn: any) {
    const p = {
      id: obj.name || obj.id || `prompt-${this.prompts.length}`,
      ...obj,
      fn,
    };
    this.prompts.push(p);
    return p;
  }

  registerResource(obj: any, fn: any) {
    const r = {
      id: obj.name || obj.uri || `resource-${this.resources.length}`,
      ...obj,
      fn,
    };
    this.resources.push(r);
    return r;
  }

  addPrompt(p: any) {
    this.prompts.push(p);
  }
  addTool(t: any) {
    this.tools.push(t);
  }
  addResource(r: any) {
    this.resources.push(r);
  }
  addResourceTemplate(t: any) {
    this.resourceTemplates.push(t);
  }

  async start(opts?: any) {
    // no-op for tests
    return Promise.resolve();
  }
}
