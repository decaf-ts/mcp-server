import { WorkspaceResourceTemplate } from "../types";
import { getWorkspaceRoot, readWorkspaceFile } from "../workspace";

export const workspaceResourceTemplates: WorkspaceResourceTemplate[] = [];

export function buildWorkspaceResourceTemplates(): WorkspaceResourceTemplate[] {
  const root = getWorkspaceRoot();
  const sharedArguments = [
    {
      name: "path",
      description: "Path relative to the workspace root",
      required: true,
    },
  ] as const;

  const templates: WorkspaceResourceTemplate[] = [
    {
      name: "vscode-workspace-file",
      description:
        "Expose workspace files to Visual Studio Code via vscode:// URIs",
      uriTemplate: "vscode://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        try {
          const text = await readWorkspaceFile(root, args.path);
          return { text: String(text) };
        } catch (err) {
          // propagate as-is for tests to assert errors
          throw err;
        }
      },
    },
    {
      name: "cursor-workspace-file",
      description: "Expose workspace files to Cursor via cursor:// URIs",
      uriTemplate: "cursor://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        try {
          const text = await readWorkspaceFile(root, args.path);
          return { text: String(text) };
        } catch (err) {
          throw err;
        }
      },
    },
    {
      name: "copilot-workspace-file",
      description:
        "Expose workspace files to GitHub Copilot via copilot:// URIs",
      uriTemplate: "copilot://workspace/{path}",
      mimeType: "text/plain",
      arguments: sharedArguments,
      load: async (args: { path: string }) => {
        try {
          const text = await readWorkspaceFile(root, args.path);
          return { text: String(text) };
        } catch (err) {
          throw err;
        }
      },
    },
  ];

  workspaceResourceTemplates.splice(
    0,
    workspaceResourceTemplates.length,
    ...templates
  );
  return workspaceResourceTemplates;
}

