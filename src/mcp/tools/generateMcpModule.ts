// New tool: generate-mcp-module
import fs from "fs";
import path from "path";
import type { Tool } from "fastmcp";
import { z } from "zod";
import { getWorkspaceRoot } from "../workspace";
import { analyzeRepo } from "../code";
import { scaffoldModule } from "../validation/scaffoldModule";

const generateSchema = z.object({
  repoPath: z.string().optional().default("."),
  moduleName: z.string().optional(),
  includeDocs: z.boolean().default(true),
});

export const generateMcpModuleTool: Tool<undefined, typeof generateSchema> = {
  name: "generate-mcp-module",
  description:
    "Generate a minimal MCP module under src/modules/<name> by analyzing a target repository and exporting prompts, resources, templates and tools.",
  parameters: generateSchema,
  execute: async (input) => {
    const args = generateSchema.parse(input as any);
    const root = getWorkspaceRoot();
    let repoRoot = path.resolve(process.cwd(), args.repoPath || ".");
    if (!fs.existsSync(repoRoot)) {
      const alt = path.resolve(process.cwd(), "..", args.repoPath);
      if (fs.existsSync(alt)) repoRoot = alt;
    }
    if (!fs.existsSync(repoRoot)) {
      const alt2 = path.resolve(
        process.cwd(),
        "..",
        path.basename(args.repoPath)
      );
      if (fs.existsSync(alt2)) repoRoot = alt2;
    }
    if (!fs.existsSync(repoRoot))
      throw new Error(`Repository not found at ${repoRoot}`);

    const analysis = analyzeRepo(repoRoot);
    const inferredName =
      args.moduleName ?? path.basename(path.resolve(repoRoot));
    const moduleRoot = path.join(root, "src", "modules", inferredName);

    // Use existing scaffold to create folders
    scaffoldModule(root, inferredName);

    // populate prompts: copy markdown prompts from README.md and docs/
    const promptsDir = path.join(moduleRoot, "prompts");
    const resourcesDir = path.join(moduleRoot, "resources");
    const templatesDir = path.join(moduleRoot, "templates");
    const toolsDir = path.join(moduleRoot, "tools");

    // helper to write an index.ts that exports arrays
    function writeIndex(dir: string, varName: string, items: string) {
      const p = path.join(dir, "index.ts");
      const content = `export const ${varName} = ${items} as const;\n`;
      fs.writeFileSync(p, content, { encoding: "utf8" });
    }

    // Prompts: create a simple prompt from README and any .md in docs
    const promptAssets: any[] = [];
    if (args.includeDocs) {
      const readme = path.join(repoRoot, "README.md");
      if (fs.existsSync(readme)) {
        const content = fs.readFileSync(readme, "utf8");
        const id = "readme";
        const promptPath = path.join(promptsDir, `${id}.md`);
        fs.writeFileSync(promptPath, content, { encoding: "utf8" });
        promptAssets.push({
          id,
          title: "README",
          description: "Repository README",
          absolutePath: promptPath,
          load: () => content,
        });
      }
      const docsDir = path.join(repoRoot, "docs");
      if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
        for (const f of fs.readdirSync(docsDir)) {
          if (!f.endsWith(".md")) continue;
          const content = fs.readFileSync(path.join(docsDir, f), "utf8");
          const id = path.parse(f).name;
          const promptPath = path.join(promptsDir, `${id}.md`);
          fs.writeFileSync(promptPath, content, { encoding: "utf8" });
          promptAssets.push({
            id,
            title: id,
            description: content.split(/\r?\n/)[0] || "",
            absolutePath: promptPath,
            load: () => content,
          });
        }
      }
    }

    writeIndex(promptsDir, "prompts", JSON.stringify(promptAssets, null, 2));

    // Resources: reference the repo root and docs
    const resourceAssets = [
      {
        id: `${inferredName}.repo`,
        name: `${inferredName} repository`,
        description: "Source repository",
        uri: `file://${repoRoot}`,
        absolutePath: repoRoot,
      },
    ];
    writeIndex(
      resourcesDir,
      "resources",
      JSON.stringify(resourceAssets, null, 2)
    );

    // Templates: create a placeholder template that references README
    const templateAssets = [
      {
        name: "readme-template",
        description: "README as guidance",
        uriTemplate: `file://${path.join(repoRoot, "README.md")}`,
        mimeType: "text/markdown",
      },
    ];
    writeIndex(
      templatesDir,
      "templates",
      JSON.stringify(templateAssets, null, 2)
    );

    // Tools: create a wrapper tool that exposes analyze/enumerate for the module
    const toolIndexPath = path.join(toolsDir, "index.ts");
    const toolContent = `import type { Tool } from 'fastmcp';\nimport { buildAnalyzeRepositoryTool, buildEnumerateCapabilitiesTool, buildPlanFeatureTool } from '../../../mcp/tools/tools';\nexport const tools = [\n  { id: '${inferredName}.analyze', title: 'Analyze ${inferredName}', description: 'Analyze the target repository', tool: buildAnalyzeRepositoryTool() },\n  { id: '${inferredName}.enumerate', title: 'Enumerate capabilities for ${inferredName}', description: 'Enumerate capabilities', tool: buildEnumerateCapabilitiesTool() },\n  { id: '${inferredName}.plan', title: 'Plan features for ${inferredName}', description: 'Plan feature implementation', tool: buildPlanFeatureTool() },\n] as const;\n`;
    fs.writeFileSync(toolIndexPath, toolContent, { encoding: "utf8" });

    // Write module index.ts
    const moduleIndex = path.join(moduleRoot, "index.ts");
    const moduleIndexContent = `import { prompts } from './prompts';\nimport { resources } from './resources';\nimport { templates } from './templates';\nimport { tools } from './tools';\nexport { prompts } from './prompts';\nexport { resources } from './resources';\nexport { templates } from './templates';\nexport { tools } from './tools';\nexport const modulePackage = { name: '${inferredName}', prompts, resources, templates, tools } as const;\n`;
    fs.writeFileSync(moduleIndex, moduleIndexContent, { encoding: "utf8" });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              moduleRoot,
              inferredName,
              analysisSummary: {
                files: analysis.files.length,
                testFiles: analysis.testFiles.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  },
};

export default generateMcpModuleTool;
