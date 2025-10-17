// Analysis helpers (minimal yet effective, text-based to avoid heavy AST deps)
import path from "path";
import fs from "fs";
import { listFilesRecursive, readFileSafe } from "./utils";

export function isSourceFile(p: string) {
  return /\.(ts|tsx|js|jsx)$/.test(p) && !p.endsWith(".d.ts");
}
export function isTestFile(p: string) {
  return /(\.test\.|\.spec\.)/.test(p);
}

export function extractExports(fileContent: string): string[] {
  const names = new Set<string>();
  const exportRe =
    /(export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+)([A-Za-z0-9_]+)/g;
  const namedRe = /export\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = exportRe.exec(fileContent))) names.add(m[2]);
  while ((m = namedRe.exec(fileContent))) {
    m[1]
      .split(",")
      .map((s) => s.trim().split(" as ")[0].trim())
      .forEach((n) => {
        if (n) names.add(n);
      });
  }
  return [...names].sort();
}

export function extractDecorators(fileContent: string): string[] {
  const decs = new Set<string>();
  const decRe = /@([A-Za-z_][A-Za-z0-9_]*)/g;
  let m: RegExpExecArray | null;
  while ((m = decRe.exec(fileContent))) decs.add(m[1]);
  return [...decs].sort();
}

export function summarizeReadme(readme?: string) {
  if (!readme) return undefined;
  const lines = readme.split(/\r?\n/).filter(Boolean);
  const title =
    lines.find((l) => /^#\s+/.test(l))?.replace(/^#\s+/, "") || "README";
  const bullets = lines.filter((l) => /^[-*]\s+/.test(l)).slice(0, 20);
  return { title, bullets };
}

export function analyzeRepo(root: string) {
  const src = path.join(root, "src");
  const testDir = path.join(root, "tests");
  const readmePath = path.join(root, "README.md");
  const readme = readFileSafe(readmePath);

  const files = fs.existsSync(src) ? listFilesRecursive(src, isSourceFile) : [];
  const testFiles = fs.existsSync(testDir)
    ? listFilesRecursive(testDir, (f) => isSourceFile(f) && isTestFile(f))
    : [];

  const api: Record<string, { exports: string[]; decorators: string[] }> = {};
  for (const f of files) {
    const content = readFileSafe(f) || "";
    api[path.relative(root, f)] = {
      exports: extractExports(content),
      decorators: extractDecorators(content),
    };
  }
  const tests: Record<string, { mentions: string[] }> = {};
  for (const f of testFiles) {
    const content = readFileSafe(f) || "";
    const mentions = Array.from(
      new Set([...extractExports(content), ...extractDecorators(content)])
    ).sort();
    tests[path.relative(root, f)] = { mentions };
  }
  return { files, testFiles, api, tests, readme: summarizeReadme(readme) };
}
