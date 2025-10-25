#!/usr/bin/env node
import { assertModuleScaffolding } from "../utils/moduleValidator";

async function main() {
  try {
    const issues = assertModuleScaffolding();
    if (issues.length) {
      console.log(
        `[module-validator] Completed with ${issues.length} issue(s) (warnings may persist)`
      );
      for (const issue of issues) {
        console.log(
          `  - [${issue.severity.toUpperCase()}] ${issue.module}: ${issue.detail}`
        );
      }
    } else {
      console.log("[module-validator] Modules validated successfully");
    }
  } catch (error) {
    console.error(`[module-validator] ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}

void main();
