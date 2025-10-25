import fs from "fs";
import path from "path";
import os from "os";
import { validateModuleScaffolding } from "../src/utils/moduleValidator";

function makeTempWorkspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-test-"));
  const modulesRoot = path.join(tmp, "src", "modules");
  fs.mkdirSync(modulesRoot, { recursive: true });
  return { tmp, modulesRoot };
}

function createModule(base: string, name: string, createAll = true) {
  const modRoot = path.join(base, name);
  fs.mkdirSync(modRoot, { recursive: true });
  const folders = ["prompts", "resources", "templates", "tools"];
  for (const f of folders) {
    const fp = path.join(modRoot, f);
    if (createAll || f !== "templates") {
      fs.mkdirSync(fp, { recursive: true });
      const indexPath = path.join(fp, "index.ts");
      fs.writeFileSync(
        indexPath,
        `export const items = [] as const;\n`,
        "utf8"
      );
    }
  }
  return modRoot;
}

const { tmp, modulesRoot } = makeTempWorkspace();
createModule(modulesRoot, "sample-valid", true);
const result = validateModuleScaffolding(tmp);
console.log("ISSUES", JSON.stringify(result.issues, null, 2));
console.log("HAS_ERRORS", result.hasErrors);
fs.rmSync(tmp, { recursive: true, force: true });
