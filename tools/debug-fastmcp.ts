import fs from "fs";
import path from "path";
import os from "os";

(async () => {
  const mod = await import("../src/fastmcp/index");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-debug-"));
  console.log("TMP", tmp);
  mod.setWorkspaceRoot(tmp);

  const promptDir = path.join(tmp, ".codex", "prompts");
  fs.mkdirSync(promptDir, { recursive: true });
  fs.writeFileSync(
    path.join(promptDir, "doc.md"),
    "Document every module with a summary and detailed description.\n"
  );

  const filePath = path.join(tmp, "src", "module.ts");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    "export function add(a: number, b: number) {\n  return a + b;\n}\n"
  );

  const templates = mod.buildResourceTemplates();
  console.log(
    "templates list",
    templates.map((t: any) => t.name)
  );

  for (const t of templates) {
    const args: any = {};
    if (t.arguments && t.arguments.some((a: any) => a.name === "name"))
      args.name = "doc";
    if (t.name === "read-code-from-source") args.path = "module.ts";
    if (t.name === "read-test-from-source") {
      const testFile = path.join(tmp, "tests", "module.test.ts");
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
      fs.writeFileSync(testFile, "test file\n");
      args.path = "module.test.ts";
    }
    if (t.name === "read-doc-from-source") {
      const docFile = path.join(tmp, "workdocs", "module.md");
      fs.mkdirSync(path.dirname(docFile), { recursive: true });
      fs.writeFileSync(docFile, "# Module\n");
      args.path = "module.md";
    }

    try {
      const out = await t.load(args);
      console.log(
        "template",
        t.name,
        "->",
        out && out.text ? out.text.length : "NO_TEXT",
        "uri",
        out && out.uri
      );
    } catch (e) {
      console.error("template", t.name, "error", e);
    }
  }

  // cleanup
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {}
})();
