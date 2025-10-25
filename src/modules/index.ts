import type { ModuleExportPackage } from "../types";
import { modulePackage as decorationModule } from "./decoration/index";
import { modulePackage as mcpModule } from "./mcp/index";
import { modulePackage as templateModule } from "./_template/index";

// modulePackage objects may be declared with readonly arrays (as const). Cast to the mutable type expected by runtime APIs.
export const modulePackages: ModuleExportPackage[] = [
  decorationModule as unknown as ModuleExportPackage,
  mcpModule as unknown as ModuleExportPackage,
  templateModule as unknown as ModuleExportPackage,
];

// register packages with module registry lazily
import { registerModulePackages } from "../mcp/moduleRegistry";
registerModulePackages(modulePackages);

// Also expose packages on a runtime global so modules that must avoid static imports
// (for circular dependency reasons) can read the list without importing moduleRegistry.
// This mirrors the behavior used by getRegisteredModulePackages() in prompts.ts
(globalThis as any).__DECAF_MODULE_PACKAGES__ = modulePackages;
