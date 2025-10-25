import fs from "fs";
import path from "path";
import type { ModuleExportPackage, PromptExport } from "../types";

export class ModuleRegistry {
  private packages: ModuleExportPackage[];

  constructor(packages: ModuleExportPackage[] = []) {
    this.packages = packages;
  }

  setPackages(pkgs: ModuleExportPackage[] | undefined) {
    this.packages = Array.isArray(pkgs) ? pkgs : [];
  }

  listPackages() {
    return this.packages;
  }

  listPrompts(): Array<PromptExport & { provenance?: string }> {
    return this.collectAssets("prompts");
  }
  listResources() {
    return this.collectAssets("resources");
  }
  listTemplates() {
    return this.collectAssets("templates");
  }
  listTools() {
    return this.collectAssets("tools");
  }

  private collectAssets<T extends keyof ModuleExportPackage>(key: T) {
    const seen = new Map<string, string>();
    const aggregated: any[] = [];
    for (const pkg of this.packages) {
      if ((pkg as any).status === "disabled") continue;
      const arr = (pkg as any)[key] || [];
      for (const asset of arr) {
        const maybeName = (asset && asset.name) as string | undefined;
        const assetKey =
          (asset && (asset.id ?? maybeName)) || JSON.stringify(asset);
        if (seen.has(assetKey)) {
          const conflict = seen.get(assetKey);
          throw new Error(
            `Duplicate ${String(key)} id '${assetKey}' from modules ${conflict} and ${pkg.name}`
          );
        }
        seen.set(assetKey, pkg.name);
        aggregated.push({ ...asset, provenance: pkg.name });
      }
    }
    return aggregated;
  }

  // Discover modules under repoRoot/src/modules and set packages accordingly (static parse)
  loadFromSrc(repoRoot: string) {
    const modulesRoot = path.join(repoRoot, "src", "modules");
    if (!fs.existsSync(modulesRoot)) {
      this.packages = [];
      return this.packages;
    }

    const subfolders = ["prompts", "resources", "templates", "tools"];
    const indexCandidates = [
      "index.ts",
      "index.tsx",
      "index.js",
      "index.cjs",
      "index.mjs",
    ];

    function findIndexFile(folder: string): string | undefined {
      for (const c of indexCandidates) {
        const f = path.join(folder, c);
        if (fs.existsSync(f)) return f;
      }
      return undefined;
    }

    function staticParseArrayFromFile(filePath: string): any[] | undefined {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const start = content.indexOf("[");
        if (start !== -1) {
          let depth = 0;
          let end = -1;
          for (let i = start; i < content.length; i++) {
            const ch = content[i];
            if (ch === "[") depth++;
            else if (ch === "]") {
              depth--;
              if (depth === 0) {
                end = i;
                break;
              }
            }
          }
          if (end !== -1) {
            const arrText = content.slice(start, end + 1);
            try {
              return JSON.parse(arrText);
            } catch (e) {
              const normalized = arrText
                .replace(/'(?:\\'|[^'])*'/g, (m) => m.replace(/'/g, '"'))
                .replace(/([\{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
                .replace(/,\s*([\]}])/g, "$1");
              try {
                return JSON.parse(normalized);
              } catch (e2) {
                return undefined;
              }
            }
          }
        }
      } catch (e) {
        return undefined;
      }
      return undefined;
    }

    const dirs = fs
      .readdirSync(modulesRoot)
      .map((d) => path.join(modulesRoot, d))
      .filter((p) => {
        try {
          return fs.statSync(p).isDirectory();
        } catch {
          return false;
        }
      });

    const packages: ModuleExportPackage[] = [];
    for (const moduleDir of dirs) {
      const pkgName = path.basename(moduleDir);
      const pkg: any = {
        name: pkgName,
        prompts: [],
        resources: [],
        templates: [],
        tools: [],
      };
      for (const sub of subfolders) {
        const folder = path.join(moduleDir, sub);
        const indexFile = findIndexFile(folder);
        if (!indexFile) continue;
        const arr = staticParseArrayFromFile(indexFile);
        if (!arr || !Array.isArray(arr)) continue;
        pkg[sub] = arr;
      }
      packages.push(pkg);
    }

    this.packages = packages;
    return this.packages;
  }
}

export const moduleRegistry = new ModuleRegistry();

export function registerModulePackages(pkgs: ModuleExportPackage[]) {
  moduleRegistry.setPackages(pkgs);
}
