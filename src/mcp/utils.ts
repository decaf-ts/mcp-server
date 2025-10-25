import fs from "fs";
import path from "path";

export function readFileSafe(
  filePath: string,
  encoding: BufferEncoding = "utf8"
): string | undefined {
  try {
    return fs.readFileSync(filePath, { encoding });
  } catch {
    return undefined;
  }
}

export function listFilesRecursive(
  root: string,
  matcher?: (p: string) => boolean
): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const f of fs.readdirSync(cur)) stack.push(path.join(cur, f));
    } else if (!matcher || matcher(cur)) {
      out.push(cur);
    }
  }
  return out.sort();
}

export function deriveCapabilities(analysis: any): string[] {
  const cap = new Set<string>();
  // heuristics: if decorators like Decoration, flavouredAs, extend, override appear, add capabilities
  const allDecs = new Set<string>();
  for (const k of Object.keys(analysis.api)) {
    for (const d of analysis.api[k].decorators) allDecs.add(d);
    for (const e of analysis.api[k].exports)
      if (/Decoration|decorate|Builder|Flavour/i.test(e))
        cap.add("use-decoration-api");
  }
  if ([...allDecs].some((d) => /override|extend/i.test(d)))
    cap.add("override-and-extend-decorations");
  if (Object.keys(analysis.tests).length > 0) cap.add("validate-with-tests");
  if (analysis.readme) cap.add("follow-readme-guides");
  return [...cap].sort();
}

