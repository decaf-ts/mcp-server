export * from "./prompts";
import { InputPrompt } from "fastmcp";
import { prompts, refreshPrompts } from "./prompts";

export const promptList: InputPrompt<undefined>[] = prompts;

export function loadPrompts(repoPath?: string): InputPrompt<undefined>[] {
  return refreshPrompts(repoPath);
}
