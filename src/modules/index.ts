import type { ModuleExportPackage } from "../types";
import { modulePackage as decorationModule } from "./decoration";
import { modulePackage as mcpModule } from "./mcp";
import { modulePackage as templateModule } from "./_template";

// modulePackage objects may be declared with readonly arrays (as const). Cast to the mutable type expected by runtime APIs.
export const modulePackages: ModuleExportPackage[] = [
  decorationModule as unknown as ModuleExportPackage,
  mcpModule as unknown as ModuleExportPackage,
  templateModule as unknown as ModuleExportPackage,
];
