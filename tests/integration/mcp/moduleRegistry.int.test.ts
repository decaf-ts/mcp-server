import { describe, expect, it } from "@jest/globals";
import { ModuleRegistry } from "../../../src/mcp/moduleRegistry";
import type { ModuleExportPackage } from "../../../src/types";

const basePackage: ModuleExportPackage = {
  name: "test-module",
  prompts: [
    {
      id: "test.prompt",
      title: "Test Prompt",
      load: () => "prompt",
    },
  ],
  resources: [],
  templates: [],
  tools: [],
};

describe("ModuleRegistry", () => {
  it("adds provenance metadata to aggregated assets", () => {
    const registry = new ModuleRegistry([basePackage]);
    const prompts = registry.listPrompts();
    expect(prompts[0].provenance).toBe("test-module");
  });

  it("throws when duplicate asset IDs are detected", () => {
    const duplicatePackage: ModuleExportPackage = {
      ...basePackage,
      name: "duplicate-module",
    };
    const registry = new ModuleRegistry([basePackage, duplicatePackage]);
    expect(() => registry.listPrompts()).toThrow(/Duplicate/);
  });
});
