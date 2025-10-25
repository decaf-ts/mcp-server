import fs from "fs";
import path from "path";
import os from "os";
import { setWorkspaceRoot, discoverDocPrompts } from "../src/mcp/mcp-module";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "decaf-mcp-"));
const promptDir = path.join(tmp, ".codex", "prompts");
fs.mkdirSync(promptDir, { recursive: true });
fs.writeFileSync(
  path.join(promptDir, "doc.md"),
  "Use TSDoc to describe modules.\n"
);
setWorkspaceRoot(tmp);
const prompts = discoverDocPrompts(tmp);
console.log(
  "FOUND",
  prompts.map((p) => p.name)
);
fs.rmSync(tmp, { recursive: true, force: true });
