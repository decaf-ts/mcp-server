import fs from "node:fs";
import path from "node:path";

const REQUIRED = ["prompts", "resources", "templates", "tools"] as const;

type ValidationIssue = {
  type: string;
  module?: string;
  detail: string;
  severity: "error" | "warning" | "info";
  modules?: string[];
};

function isDir(p: string) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

export function listModuleDirectories(workspaceRoot: string) {
  const modulesDir = path.join(workspaceRoot, "src", "modules");
  if (!isDir(modulesDir)) return [] as string[];
  return fs.readdirSync(modulesDir).filter((name) => {
    const p = path.join(modulesDir, name);
    return isDir(p);
  });
}

export function validateModuleScaffolding(workspaceRoot = process.cwd()) {
  const issues: ValidationIssue[] = [];
  const modules = listModuleDirectories(workspaceRoot);

  // gather module packages if a modules/index exists (attempt to parse minimal ids)
  const manifest: Record<string, boolean> = {};
  try {
    const manifestPath = path.join(workspaceRoot, "src", "modules", "index.ts");
    if (fs.existsSync(manifestPath)) {
      const txt = fs.readFileSync(manifestPath, "utf8");
      const re = /name\s*:\s*['"` ]?([^'"`,}]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(txt)) !== null) {
        manifest[m[1]] = true;
      }
    }
  } catch {
    // ignore parse errors
  }

  for (const moduleName of modules) {
    for (const folder of REQUIRED) {
      const folderPath = path.join(
        workspaceRoot,
        "src",
        "modules",
        moduleName,
        folder
      );
      if (!isDir(folderPath)) {
        issues.push({
          type: "missing-folder",
          module: moduleName,
          detail: `Missing ${folder} directory at ${folderPath}`,
          severity: "error",
        });
        continue;
      }
      const indexTs = path.join(folderPath, "index.ts");
      const indexJs = path.join(folderPath, "index.js");
      const indexCjs = path.join(folderPath, "index.cjs");
      const idx = fs.existsSync(indexTs)
        ? indexTs
        : fs.existsSync(indexJs)
          ? indexJs
          : fs.existsSync(indexCjs)
            ? indexCjs
            : null;
      if (!idx) {
        issues.push({
          type: "missing-export",
          module: moduleName,
          detail: `Expected ${folder}/index.* export for module ${moduleName}`,
          severity: "error",
        });
        continue;
      }
      const text = fs.readFileSync(idx, "utf8");
      const exported =
        /\bexport\b/.test(text) ||
        /module\.exports/.test(text) ||
        /exports\./.test(text);
      const disabled = /disabled\s*:\s*true/.test(text);
      if (!exported && !disabled) {
        issues.push({
          type: "no-export",
          module: moduleName,
          detail: `No export found in ${folder}/index and not explicitly disabled`,
          severity: "error",
        });
      }
    }

    if (!manifest[moduleName]) {
      issues.push({
        type: "not-registered",
        module: moduleName,
        detail: `Module ${moduleName} is not registered in src/modules/index.ts`,
        severity: "error",
      });
    }
  }

  // Check for duplicate ids across modules
  const idMap = new Map<string, string[]>();
  for (const moduleName of modules) {
    for (const folder of REQUIRED) {
      const folderPath = path.join(
        workspaceRoot,
        "src",
        "modules",
        moduleName,
        folder
      );
      const idx = [
        path.join(folderPath, "index.ts"),
        path.join(folderPath, "index.js"),
        path.join(folderPath, "index.cjs"),
      ].find(fs.existsSync);
      if (!idx) continue;
      const text = fs.readFileSync(idx, "utf8");
      const re = /id\s*:\s*['"` ]?([^'"` ,}]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const id = m[1];
        if (!id) continue;
        if (!idMap.has(id)) idMap.set(id, []);
        idMap.get(id)!.push(moduleName);
      }
    }
  }

  for (const [id, mods] of idMap.entries()) {
    if (mods.length > 1) {
      issues.push({
        type: "duplicate-id",
        detail: `Duplicate id ${id} in modules: ${mods.join(", ")}`,
        modules: mods,
        severity: "error",
      });
    }
  }

  const hasErrors = issues.some((i) => i.severity === "error");
  return { issues, hasErrors };
}

export function assertModuleScaffolding(workspaceRoot = process.cwd()) {
  const { issues, hasErrors } = validateModuleScaffolding(workspaceRoot);
  if (hasErrors) {
    const details = issues
      .filter((i) => i.severity === "error")
      .map((i) => `- [${i.module || "?"}] ${i.detail}`)
      .join("\n");
    const err = new Error(`Module validation failed:\n${details}`);
    // attach details for callers
    (err as unknown as { issues?: ValidationIssue[] }).issues = issues;
    throw err;
  }
  return issues;
}

