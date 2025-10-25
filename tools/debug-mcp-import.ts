import { setWorkspaceRoot, buildResourceTemplates } from "../src/mcp";
import fs from "fs";
import path from "path";
import os from "os";
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-debug-"));
  console.log("TMP", tmp);
  setWorkspaceRoot(tmp);
  const promptDir = path.join(tmp, ".codex", "prompts");
  fs.mkdirSync(promptDir, { recursive: true });
  fs.writeFileSync(path.join(promptDir, "doc.md"), "doc");
  const filePath = path.join(tmp, "src", "module.ts");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "export {}");
  const templates = buildResourceTemplates();
  console.log(
    "templates",
    templates.map((t) => t.name)
  );
  for (const t of templates) {
    const args: any = {};
    if (t.arguments && t.arguments.some((a: any) => a.name === "name"))
      args.name = "doc";
    if (t.name === "read-code-from-source") args.path = "module.ts";
    if (t.name === "read-test-from-source") {
      fs.mkdirSync(path.join(tmp, "tests"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "tests", "module.test.ts"), "test");
      args.path = "module.test.ts";
    }
    if (t.name === "read-doc-from-source") {
      fs.mkdirSync(path.join(tmp, "workdocs"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "workdocs", "module.md"), "md");
      args.path = "module.md";
    }
    const out = await t.load(args);
    console.log("template", t.name, "->", out.text?.length, "uri", out.uri);
  }
})();
