import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FIXTURE_ROOT = path.resolve(__dirname, "../../fixtures/modules");

export function createTempModulesRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "decaf-modules-"));
}

export function copyFixtureModule(
  targetRoot: string,
  fixtureName: string
): string {
  const source = path.join(FIXTURE_ROOT, fixtureName);
  if (!fs.existsSync(source)) {
    throw new Error(`Fixture ${fixtureName} does not exist at ${source}`);
  }
  const destination = path.join(targetRoot, fixtureName);
  fs.cpSync(source, destination, { recursive: true });
  return destination;
}

export function removeTempModulesRoot(root: string) {
  if (fs.existsSync(root)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export function createWorkspaceWithModules(
  fixtureNames: string[]
): { workspaceRoot: string; modulesRoot: string } {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-ws-"));
  const modulesRoot = path.join(workspaceRoot, "src/modules");
  fs.mkdirSync(modulesRoot, { recursive: true });
  for (const name of fixtureNames) {
    copyFixtureModule(modulesRoot, name);
  }
  return { workspaceRoot, modulesRoot };
}

export function removeWorkspaceRoot(root: string) {
  removeTempModulesRoot(root);
}
