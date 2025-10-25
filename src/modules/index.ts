import type { ModuleExportPackage } from "../types";
import { modulePackage as decorationModule } from "./decoration";
import { modulePackage as mcpModule } from "./mcp";

export const modulePackages: ModuleExportPackage[] = [
  decorationModule,
  mcpModule,
];
