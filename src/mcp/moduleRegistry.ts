import type {
  ModuleExportPackage,
  PromptAsset,
  ResourceAsset,
  TemplateAsset,
  ToolAsset,
} from "../types";
import { modulePackages } from "../modules";

type AssetKey = "prompts" | "resources" | "templates" | "tools";

export class ModuleRegistry {
  constructor(private readonly packages: ModuleExportPackage[] = modulePackages) {}

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

  private collectAssets<T extends PromptAsset | ResourceAsset | TemplateAsset | ToolAsset>(
    key: AssetKey
  ): T[] {
    const seen = new Map<string, string>();
    const aggregated: T[] = [];

    for (const pkg of this.packages) {
      if (pkg.status === "disabled") continue;
      for (const asset of pkg[key] as T[]) {
        if (seen.has(asset.id)) {
          const conflict = seen.get(asset.id);
          throw new Error(
            `Duplicate ${key} id '${asset.id}' from modules ${conflict} and ${pkg.name}`
          );
        }
        seen.set(asset.id, pkg.name);
        aggregated.push({ ...asset, provenance: pkg.name });
      }
    }

    return aggregated;
  }
}

export const moduleRegistry = new ModuleRegistry();
