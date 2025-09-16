import fs from "fs";
import path from "path";

/**
 * Lightweight filesystem helpers for tools
 */
export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function writeTextFile(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, { encoding: "utf-8" });
}

export function readTextFile(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  return fs.readFileSync(filePath, { encoding: "utf-8" });
}

export function fileExists(filePath: string) {
  return fs.existsSync(filePath);
}
