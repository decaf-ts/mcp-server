import fs from "fs";
import path from "path";

export type ScaffoldResult = {
  modulePath: string;
  createdFiles: string[];
};

const DEFAULT_PLACEHOLDERS = {
  prompts: `export const promptList = [
  {
    id: "example-prompt",
    title: "Example prompt",
    description: "A placeholder prompt created by scaffoldModule",
    content: "Describe the task for the assistant...",
    absolutePath: __filename,
  },
] as const;
`,
  resources: `export const resources = [
  {
    id: "example-resource",
    name: "Example Resource",
    description: "A placeholder resource created by scaffoldModule",
    uri: "file://placeholder",
    absolutePath: __filename,
  },
] as const;
`,
  templates: `export const templates = [
  {
    name: "example-template",
    description: "A placeholder template created by scaffoldModule",
    uriTemplate: "file://template/{path}",
    mimeType: "text/plain",
  },
] as const;
`,
  tools: `export const toolList = [
  {
    id: "example-tool",
    name: "example-tool",
    description: "A placeholder tool created by scaffoldModule",
    run: async () => ({ result: "placeholder" }),
  },
] as const;
`,
};

/**
 * Create a module scaffold under repoRoot/src/modules/<moduleName>
 * Returns created files list.
 */
export function scaffoldModule(
  repoRoot: string,
  moduleName: string
): ScaffoldResult {
  if (!repoRoot) throw new Error("repoRoot is required");
  if (!moduleName) throw new Error("moduleName is required");

  const modulePath = path.join(repoRoot, "src", "modules", moduleName);
  const createdFiles: string[] = [];

  const subfolders = ["prompts", "resources", "templates", "tools"];

  for (const folder of subfolders) {
    const folderPath = path.join(modulePath, folder);
    fs.mkdirSync(folderPath, { recursive: true });
    const indexPath = path.join(folderPath, "index.ts");
    // if file exists, skip writing
    if (!fs.existsSync(indexPath)) {
      // insert __filename for absolutePath in placeholders
      const content = DEFAULT_PLACEHOLDERS[
        folder as keyof typeof DEFAULT_PLACEHOLDERS
      ].replace(/__filename/g, JSON.stringify(indexPath));
      fs.writeFileSync(indexPath, content, { encoding: "utf8" });
      createdFiles.push(indexPath);
    }
  }

  return { modulePath, createdFiles };
}

// CLI support when required directly via ts-node registration
if (require.main === module) {
  const [, , moduleName] = process.argv;
  if (!moduleName) {
    console.error("Usage: scaffold-module <module-name>");
    process.exit(1);
  }
  try {
    const res = scaffoldModule(process.cwd(), moduleName);
    console.log("Scaffolded module:", res.modulePath);
    for (const f of res.createdFiles) console.log("  created:", f);
    process.exit(0);
  } catch (err: any) {
    console.error(err && err.message ? err.message : err);
    process.exit(2);
  }
}
