/**
 * @description The filename that identifies Decaf CLI modules
 * @summary The standard filename for CLI module files where each library must export a single CliModule function
 *
 * @const MCP_FILE_NAME
 * @memberOf module:MCP
 */
export const MCP_FILE_NAME = "mcp-module";


const WORKSPACE_ROOT_ENV = "MCP_WORKSPACE_ROOT";
const PROMPT_DIRECTORIES = [".code/prompts", ".codex/prompts"];
const DEFAULT_PROMPT_NAME = "doc";
const CLIENT_INTEGRATIONS = [
  {
    id: "vscode",
    display: "Visual Studio Code",
    instructions:
      "When interacting from Visual Studio Code, prefer the vscode://workspace/{path} resource template to fetch file contents and use the apply-code-change tool to commit edits with previewable diffs.",
  },
  {
    id: "cursor",
    display: "Cursor",
    instructions:
      "Cursor clients can retrieve and update files through the cursor://workspace/{path} resource template. Always validate patches in dryRun mode before applying permanent changes.",
  },
  {
    id: "copilot",
    display: "GitHub Copilot",
    instructions:
      "Use the copilot://workspace/{path} resource template to stream file content into Copilot chat sessions. Prefer returning unified diffs to maintain alignment with Copilot's diff visualization.",
  },
] as const;
