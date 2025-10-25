import path from "path";
import fs from "fs";
import { getWorkspaceRoot, setWorkspaceRoot } from "../src/mcp/workspace";
import { generateMcpModuleTool } from "../src/mcp/tools/generateMcpModule";
import { validateModuleScaffolding } from "../src/utils/moduleValidator";
import { aggregateModules } from "../src/mcp/aggregateModules";

async function run() {
  const repo = "./decoration";
  const root = getWorkspaceRoot();
  console.log("Workspace root:", root);

  console.log("Generating MCP module for", repo);
  const gen = await generateMcpModuleTool.execute({ repoPath: repo } as any);
  console.log("Generation result:", JSON.stringify(gen, null, 2));

  console.log("Validating modules...");
  const report = validateModuleScaffolding(root);
  console.log("Validation:", JSON.stringify(report, null, 2));

  const agg = await aggregateModules(root);
  console.log(
    "Aggregated prompts:",
    agg.prompts.map((p: any) => p.id)
  );
  console.log("Conflicts:", agg.conflicts);

  // Write JSON report
  try {
    fs.mkdirSync("workdocs/reports", { recursive: true });
    fs.writeFileSync(
      "workdocs/reports/module-validation.json",
      JSON.stringify(report, null, 2),
      "utf8"
    );
    console.log("Wrote workdocs/reports/module-validation.json");
  } catch (e) {}
}

run().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(2);
});
