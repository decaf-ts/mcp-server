import path from "node:path";
import { describe, expect, it, afterEach } from "@jest/globals";
import {
  createWorkspaceWithModules,
  removeWorkspaceRoot,
} from "./__helpers__/moduleFixtures";
import { validateModuleScaffolding } from "../../src/utils/moduleValidator";

const FIXTURE_ROOT = path.resolve(__dirname, "../fixtures");

describe("ModuleScaffoldingValidator", () => {
  const workspaceRoots: string[] = [];

  afterEach(() => {
    while (workspaceRoots.length) {
      const root = workspaceRoots.pop();
      if (root) {
        removeWorkspaceRoot(root);
      }
    }
  });

  it("flags modules that are not registered in the manifest", () => {
    const { workspaceRoot } = createWorkspaceWithModules(["sample-module"]);
    workspaceRoots.push(workspaceRoot);

    const result = validateModuleScaffolding(workspaceRoot);
    expect(result.hasErrors).toBe(true);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: "sample-module",
          type: "missing-export",
        }),
      ])
    );
  });

  it("passes the real workspace modules", () => {
    const realWorkspace = path.resolve(FIXTURE_ROOT, "../../..");
    const result = validateModuleScaffolding(realWorkspace);
    expect(result.hasErrors).toBe(false);
  });
});
