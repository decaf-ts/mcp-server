import fs from "fs";
import path from "path";

type Provenance = { moduleName: string; modulePath: string };
type Conflict = { key: string; existing: Provenance; incoming: Provenance };

const SUBFOLDERS = ["prompts", "resources", "templates", "tools"];
const INDEX_CANDIDATES = [
  "index.ts",
  "index.tsx",
  "index.js",
  "index.cjs",
  "index.mjs",
];

function findIndexFile(folder: string): string | undefined {
  for (const c of INDEX_CANDIDATES) {
    const f = path.join(folder, c);
    if (fs.existsSync(f)) return f;
  }
  return undefined;
}

function makeKeyForItem(item: any): string {
  if (!item) return JSON.stringify(item);
  if (typeof item === "string") return `str:${item}`;
  if (typeof item === "number") return `num:${item}`;
  if (item.id) return `id:${item.id}`;
  if (item.name) return `name:${item.name}`;
  try {
    return `obj:${JSON.stringify(item)}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    return `obj:${String(item)}`;
  }
}

function staticParseArrayFromFile(filePath: string): any[] | undefined {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const start = content.indexOf("[");
    if (start !== -1) {
      let depth = 0;
      let end = -1;
      for (let i = start; i < content.length; i++) {
        const ch = content[i];
        if (ch === "[") depth++;
        else if (ch === "]") {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }
      if (end !== -1) {
        const arrText = content.slice(start, end + 1);
        try {
          return JSON.parse(arrText);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // try to normalize TS-like object literal to JSON
          const normalized = arrText
            .replace(/'(?:\\'|[^'])*'/g, (m) => m.replace(/'/g, '"'))
            .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
            .replace(/,\s*([\]}])/g, "$1");
          try {
            return JSON.parse(normalized);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e2) {
            // give up static parse
            return undefined;
          }
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return undefined;
  }
  return undefined;
}

function findModuleDirs(repoRoot: string): string[] {
  const modulesRoot = path.join(repoRoot, "src", "modules");
  if (!fs.existsSync(modulesRoot)) return [];
  return fs
    .readdirSync(modulesRoot)
    .map((d) => path.join(modulesRoot, d))
    .filter((p) => {
      try {
        return fs.statSync(p).isDirectory();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return false;
      }
    });
}

export async function EnrichCoreWithAggregation(
  server: any,
  repoRoot?: string
) {
  const root = repoRoot || process.cwd();
  const dirs = findModuleDirs(root);
  const master: {
    prompts: any[];
    resources: any[];
    templates: any[];
    tools: any[];
    conflicts: Conflict[];
  } = { prompts: [], resources: [], templates: [], tools: [], conflicts: [] };

  const maps: Record<string, Map<string, Provenance>> = {
    prompts: new Map(),
    resources: new Map(),
    templates: new Map(),
    tools: new Map(),
  };

  for (const moduleDir of dirs) {
    const moduleName = path.basename(moduleDir);
    for (const sub of SUBFOLDERS) {
      const folder = path.join(moduleDir, sub);
      const indexFile = findIndexFile(folder);
      if (!indexFile) continue;
      const arr = staticParseArrayFromFile(indexFile);
      if (!arr || !Array.isArray(arr)) continue;
      for (const item of arr) {
        const key = makeKeyForItem(item);
        const provenance: Provenance = { moduleName, modulePath: moduleDir };
        const map = maps[sub];
        if (map.has(key)) {
          const existing = map.get(key)!;
          master.conflicts.push({ key, existing, incoming: provenance });
          continue; // skip duplicate
        }
        map.set(key, provenance);
        const enriched = { ...item, provenance };
        master[sub as keyof typeof master].push(enriched);
        // register on server if methods exist
        try {
          if (
            sub === "prompts" &&
            server &&
            typeof server.addPrompt === "function"
          ) {
            server.addPrompt(enriched);
          }
          if (
            sub === "tools" &&
            server &&
            typeof server.addTool === "function"
          ) {
            server.addTool(enriched);
          }
          if (
            (sub === "resources" || sub === "templates") &&
            server &&
            typeof server.addResourceTemplate === "function"
          ) {
            // resources and templates can be added via addResourceTemplate for tests
            server.addResourceTemplate(enriched);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  return master;
}
