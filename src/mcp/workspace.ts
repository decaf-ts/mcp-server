import fs from "fs";
import path from "path";
import { WORKSPACE_ROOT_ENV } from "../constants";

let workspaceRoot = initializeWorkspaceRoot();
let userErrorCtor: (new (message: string) => Error) | undefined;

export class WorkspaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceError";
  }
}

function initializeWorkspaceRoot(): string {
  const configured = process.env[WORKSPACE_ROOT_ENV];
  if (configured && configured.trim().length > 0) {
    return path.resolve(configured.trim());
  }
  return process.cwd();
}

async function getUserErrorCtor(): Promise<new (message: string) => Error> {
  if (!userErrorCtor) {
    try {
      const mod = await import("fastmcp");
      userErrorCtor = (mod as { UserError: new (message: string) => Error })
        .UserError;
    } catch {
      userErrorCtor = class MCPUserError extends Error {
        constructor(message: string) {
          super(message);
          this.name = "MCPUserError";
        }
      };
    }
  }
  return userErrorCtor;
}

export async function throwUserError(message: string): Promise<never> {
  const Ctor = await getUserErrorCtor();
  throw new Ctor(message);
}

export function setWorkspaceRoot(root: string) {
  workspaceRoot = path.resolve(root);
}

export function getWorkspaceRoot(): string {
  return workspaceRoot;
}

export function resolveInWorkspace(root: string, targetPath: string): string {
  const resolved = path.isAbsolute(targetPath)
    ? path.normalize(targetPath)
    : path.resolve(root, targetPath);

  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new WorkspaceError(
      `Path ${targetPath} escapes the workspace root at ${root}`
    );
  }

  return resolved;
}

export async function readWorkspaceFile(
  root: string,
  target: string
): Promise<string> {
  try {
    const absolute = resolveInWorkspace(root, target);
    return fs.readFileSync(absolute, "utf8" as BufferEncoding);
  } catch (error) {
    if (error instanceof WorkspaceError) {
      await throwUserError(error.message);
    }
    /* istanbul ignore next */
    throw error;
  }
}

export function __resetWorkspaceRoot(root: string) {
  setWorkspaceRoot(root);
}
