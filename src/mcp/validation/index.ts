// New: validation entrypoint for module structure
import fs from "fs";
import path from "path";

export type ValidationIssue = {
  module: string;
  path: string;
  type:
    | "missing-folder"
    | "missing-export"
    | "empty-list"
    | "disabled"
    | "other";
  detail?: string;
};

export type ValidationReport = {
  ok: boolean;
  modulesChecked: number;
  issues: ValidationIssue[];
};

const REQUIRED_SUBFOLDERS = ["prompts", "resources", "templates", "tools"];

export function findModuleDirs(repoRoot: string): string[] {
  const modulesPath = path.resolve(repoRoot, "src", "modules");
  if (!fs.existsSync(modulesPath) || !fs.statSync(modulesPath).isDirectory()) {
    return [];
  }
  return fs
    .readdirSync(modulesPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(modulesPath, d.name));
}

function hasIndexExport(folderPath: string): boolean {
  const candidates = [
    "index.ts",
    "index.tsx",
    "index.js",
    "index.cjs",
    "index.mjs",
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(folderPath, c))) return true;
  }
  return false;
}

export function validateModules(repoRoot: string): ValidationReport {
  const dirs = findModuleDirs(repoRoot);
  const issues: ValidationIssue[] = [];

  for (const moduleDir of dirs) {
    const moduleName = path.basename(moduleDir);
    for (const sub of REQUIRED_SUBFOLDERS) {
      const subPath = path.join(moduleDir, sub);
      if (!fs.existsSync(subPath) || !fs.statSync(subPath).isDirectory()) {
        issues.push({
          module: moduleName,
          path: subPath,
          type: "missing-folder",
          detail: `Required folder '${sub}' is missing in module '${moduleName}'`,
        });
        continue;
      }
      // If folder exists, check for index export
      if (!hasIndexExport(subPath)) {
        issues.push({
          module: moduleName,
          path: subPath,
          type: "missing-export",
          detail: `No index export found in '${subPath}'. Expected one of index.ts, index.js, etc.`,
        });
        continue;
      }
      // Optionally inspect the index file to see if it exports a list (lightweight check)
      try {
        const indexFile = candidatesFindingIndex(subPath);
        if (indexFile) {
          const content = fs.readFileSync(indexFile, "utf8");
          // crude heuristics: look for `export const name = [` or `export const name: Type[] = [`,
          // or any named export like `export { something }` which implies exports exist.
          const exportListPattern =
            /export\s+(const|let|var)\s+[\w$]+(?:\s*:\s*[^=]+)?\s*=\s*\[/;
          if (
            !exportListPattern.test(content) &&
            !/export\s+\{/.test(content)
          ) {
            issues.push({
              module: moduleName,
              path: indexFile,
              type: "empty-list",
              detail: `Index file does not appear to export a list of assets: ${path.basename(indexFile)}`,
            });
          }
        }
      } catch (err: any) {
        issues.push({
          module: moduleName,
          path: subPath,
          type: "other",
          detail: `Error reading index file: ${err.message}`,
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    modulesChecked: dirs.length,
    issues,
  };
}

function candidatesFindingIndex(folderPath: string): string | undefined {
  const candidates = [
    "index.ts",
    "index.tsx",
    "index.js",
    "index.cjs",
    "index.mjs",
  ];
  for (const c of candidates) {
    const full = path.join(folderPath, c);
    if (fs.existsSync(full)) return full;
  }
  return undefined;
}

// CLI helper
if (require.main === module) {
  const repoRoot = process.cwd();
  const report = validateModules(repoRoot);
  if (!report.ok) {
    console.error(
      "Module validation failed:\n",
      JSON.stringify(report, null, 2)
    );
    process.exit(2);
  }
  console.log("Module validation passed");
  process.exit(0);
}
