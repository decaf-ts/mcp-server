import { jest } from "@jest/globals";
import { assertModuleScaffolding } from "../src/utils/moduleValidator";

class MockUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

class MockFastMCP {
  public prompts: any[] = [];
  public tools: any[] = [];
  public templates: any[] = [];

  constructor(public options: Record<string, unknown>) {}

  addPrompt(prompt: any) {
    this.prompts.push(prompt);
    return this;
  }

  addTool(tool: any) {
    this.tools.push(tool);
    return this;
  }

  addResourceTemplate(template: any) {
    this.templates.push(template);
    return this;
  }
}

jest.mock("fastmcp", () => ({
  FastMCP: MockFastMCP,
  UserError: MockUserError,
}));

// Use global beforeAll when running under Jest; otherwise no-op
if (typeof (global as any).beforeAll === "function") {
  (global as any).beforeAll(() => {
    if (process.env.ENFORCE_MODULE_VALIDATION === "1") {
      assertModuleScaffolding();
    }
  });
}
