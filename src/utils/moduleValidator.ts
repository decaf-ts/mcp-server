import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "../mcp/workspace";
import type { ModuleExportPackage, ValidationIssue } from "../types";
import {
  REQUIRED_MODULE_FOLDERS,
  listModuleDirectories,
  resolveModuleFolderPath,
} from "./modulePaths";
import { modulePackages } from "../modules";

export type ModuleValidationSummary = {
  issues: ValidationIssue[];
  hasErrors: boolean;
  packages: ModuleExportPackage[];
};

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

export function validateModuleScaffolding(
  workspaceRoot = getWorkspaceRoot()
): ModuleValidationSummary {
  const issues: ValidationIssue[] = [];
  const modules = listModuleDirectories(workspaceRoot);
  const manifest = new Map(modulePackages.map((pkg) => [pkg.name, pkg]));

  for (const moduleName of modules) {
    for (const folder of REQUIRED_MODULE_FOLDERS) {
      const folderPath = resolveModuleFolderPath(
        moduleName,
        folder,
        workspaceRoot
      );
      if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        issues.push({
          type: "missing-folder",
          module: moduleName,
          detail: `Missing ${folder} directory at ${folderPath}`,
          severity: "error",
        });
        continue;
      }

      const indexTs = path.join(folderPath, "index.ts");
      if (!fileExists(indexTs)) {
        issues.push({
          type: "missing-export",
          module: moduleName,
          detail: `Expected ${folder}/index.ts export for module ${moduleName}`,
          severity: "error",
        });
      }
    }

    if (!manifest.has(moduleName)) {
      issues.push({
        type: "missing-export",
        module: moduleName,
        detail: `Module ${moduleName} is not registered in src/modules/index.ts`,
        severity: "error",
      });
    }
  }

  for (const pkg of modulePackages) {
    if (pkg.status === "disabled") continue;
    for (const [key, assets] of Object.entries({
      prompts: pkg.prompts,
      resources: pkg.resources,
      templates: pkg.templates,
      tools: pkg.tools,
    })) {
      if (!assets.length) {
        issues.push({
          type: "empty-asset",
          module: pkg.name,
          detail: `Module ${pkg.name} has no ${key} defined`,
          severity: "warning",
        });
      }
    }
  }

  const hasErrors = issues.some((issue) => issue.severity === "error");
  return { issues, hasErrors, packages: modulePackages };
}

export function assertModuleScaffolding(workspaceRoot = getWorkspaceRoot()) {
  const { issues, hasErrors } = validateModuleScaffolding(workspaceRoot);
  if (hasErrors) {
    const details = issues
      .filter((issue) => issue.severity === "error")
      .map((issue) => `- [${issue.module}] ${issue.detail}`)
      .join("\n");
    throw new Error(`Module validation failed:\n${details}`);
  }
  return issues;
}
