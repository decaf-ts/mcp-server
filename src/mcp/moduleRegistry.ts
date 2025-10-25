// ...existing code...
import type { ModuleExportPackage, PromptExport } from "../types";

export class ModuleRegistry {
  private packages: ModuleExportPackage[];

  constructor(packages: ModuleExportPackage[] = []) {
    this.packages = packages;
  }

  listPrompts(): Array<PromptExport & { provenance?: string }> {
    const seen = new Set<string>();
    const out: Array<PromptExport & { provenance?: string }> = [];

    for (const pkg of this.packages) {
      const prov = pkg.name;
      const prompts = pkg.prompts || [];
      for (const p of prompts) {
        if (seen.has(p.id)) {
          throw new Error(`Duplicate prompt id detected: ${p.id}`);
        }
        seen.add(p.id);
        out.push({ ...p, provenance: prov });
      }
    }

    return out;
  }
}
