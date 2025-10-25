import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "../mcp/workspace";

export const REQUIRED_MODULE_FOLDERS = [
  "prompts",
  "resources",
  "templates",
  "tools",
] as const;

export type ModuleFolder = (typeof REQUIRED_MODULE_FOLDERS)[number];

export function resolveModulesRoot(workspaceRoot = getWorkspaceRoot()): string {
  return path.resolve(workspaceRoot, "src/modules");
}

export function listModuleDirectories(workspaceRoot = getWorkspaceRoot()): string[] {
  const root = resolveModulesRoot(workspaceRoot);
  if (!fs.existsSync(root)) return [];

  return fs
    .readdirSync(root)
    .map((entry) => ({
      entry,
      absolute: path.join(root, entry),
    }))
    .filter(({ absolute }) => fs.statSync(absolute).isDirectory())
    .map(({ entry }) => entry)
    .sort();
}

export function resolveModulePath(
  moduleName: string,
  workspaceRoot = getWorkspaceRoot()
): string {
  return path.join(resolveModulesRoot(workspaceRoot), moduleName);
}

export function resolveModuleFolderPath(
  moduleName: string,
  folder: ModuleFolder,
  workspaceRoot = getWorkspaceRoot()
): string {
  return path.join(resolveModulePath(moduleName, workspaceRoot), folder);
}
