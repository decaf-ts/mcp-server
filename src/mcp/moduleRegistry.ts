import type {
  ModuleExportPackage,
  PromptAsset,
  ResourceAsset,
  TemplateAsset,
  ToolAsset,
} from "../types";

type AssetKey = "prompts" | "resources" | "templates" | "tools";

export class ModuleRegistry {
  constructor(private packages: ModuleExportPackage[] = []) {}

  setPackages(pkgs: ModuleExportPackage[]) {
    this.packages = Array.isArray(pkgs) ? pkgs : [];
  }

  listPackages(): ModuleExportPackage[] {
    return this.packages;
  }

  listPrompts(): PromptAsset[] {
    return this.collectAssets("prompts");
  }

  listResources(): ResourceAsset[] {
    return this.collectAssets("resources");
  }

  listTemplates(): TemplateAsset[] {
    return this.collectAssets("templates");
  }

  listTools(): ToolAsset[] {
    return this.collectAssets("tools");
  }

  private collectAssets<
    T extends PromptAsset | ResourceAsset | TemplateAsset | ToolAsset,
  >(key: AssetKey): T[] {
    const seen = new Map<string, string>();
    const aggregated: T[] = [];

    for (const pkg of this.packages) {
      if (pkg.status === "disabled") continue;
      for (const asset of (pkg as any)[key] as T[]) {
        const maybeName = (asset as any).name as string | undefined;
        const assetKey =
          (asset && (asset.id ?? maybeName)) || JSON.stringify(asset);
        if (seen.has(assetKey)) {
          const conflict = seen.get(assetKey);
          throw new Error(
            `Duplicate ${key} id '${assetKey}' from modules ${conflict} and ${pkg.name}`
          );
        }
        seen.set(assetKey, pkg.name);
        aggregated.push({ ...asset, provenance: pkg.name });
      }
    }

    return aggregated;
  }
}

export const moduleRegistry = new ModuleRegistry();

export function registerModulePackages(pkgs: ModuleExportPackage[]) {
  moduleRegistry.setPackages(pkgs);
}
