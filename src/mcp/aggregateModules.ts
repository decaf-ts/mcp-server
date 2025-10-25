// Aggregator: import module index files and merge exported arrays with provenance + duplicate detection
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { findModuleDirs } from "./validation";

export type Provenance = { moduleName: string; modulePath: string };
export type AggregationConflict = {
  key: string;
  existing: Provenance;
  incoming: Provenance;
};

export type AggregationResult<T = any> = {
  prompts: Array<T & { provenance: Provenance }>;
  resources: Array<T & { provenance: Provenance }>;
  templates: Array<T & { provenance: Provenance }>;
  tools: Array<T & { provenance: Provenance }>;
  conflicts: AggregationConflict[];
};

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
  // fallback to stable string
  try {
    return `obj:${JSON.stringify(item)}`;
  } catch (e) {
    return `obj:${String(item)}`;
  }
}

async function loadArrayFromIndex(
  filePath: string
): Promise<any[] | undefined> {
  // Prefer a fast, static parse of the first array literal found in the file.
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
        } catch (e) {
          // Normalize TS object literals to JSON:
          // - convert single quotes to double quotes
          // - quote unquoted object keys
          // - strip trailing commas
          const normalized = arrText
            // unify quotes in string literals
            .replace(/'(?:\\'|[^'])*'/g, (m) => m.replace(/'/g, '"'))
            // quote unquoted keys after { or ,
            .replace(/([\{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
            // remove trailing commas before ] or }
            .replace(/,(\s*[\}\]])/g, '$1');
          try {
            return JSON.parse(normalized);
          } catch (e2) {
            // fallthrough to import attempt below
          }
        }
      }
    }
  } catch (e) {
    // ignore static parse errors and fall back to import
  }

  try {
    const fileUrl = pathToFileURL(filePath).href;
    const mod = await import(fileUrl);
    // Find first export that is an array
    for (const key of Object.keys(mod)) {
      const val = (mod as any)[key];
      if (Array.isArray(val)) return val;
    }
    // default export check
    if (Array.isArray((mod as any).default)) return (mod as any).default;
    return undefined;
  } catch (err) {
    // fallback: if import fails, try to static-parse again (already attempted) and finally return undefined
    return undefined;
  }
}

export async function aggregateModules(
  repoRoot: string
): Promise<AggregationResult> {
  const dirs = findModuleDirs(repoRoot);
  const master = {
    prompts: [] as any[],
    resources: [] as any[],
    templates: [] as any[],
    tools: [] as any[],
    conflicts: [] as AggregationConflict[],
  };

  // maps to detect duplicates per type
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
      let arr: any[] | undefined;
      try {
        arr = await loadArrayFromIndex(indexFile);
      } catch (err: any) {
        // skip module on import error but record as conflict-like issue
        master.conflicts.push({
          key: `import-error:${moduleName}:${sub}`,
          existing: { moduleName, modulePath: moduleDir },
          incoming: { moduleName, modulePath: moduleDir },
        });
        continue;
      }
      if (!arr || !Array.isArray(arr)) continue;

      for (const item of arr) {
        const key = makeKeyForItem(item);
        const provenance = { moduleName, modulePath: moduleDir };
        const map = maps[sub];
        if (map.has(key)) {
          // record conflict deterministically (existing vs incoming)
          const existing = map.get(key)!;
          master.conflicts.push({ key, existing, incoming: provenance });
          // skip adding duplicate
          continue;
        }
        map.set(key, provenance);
        (master as any)[sub].push({ ...item, provenance });
      }
    }
  }

  return master;
}

// For compatibility with CommonJS call sites (not exported by ESM), provide a sync wrapper
export function aggregateModulesSync(repoRoot: string) {
  // synchronous wrapper that runs the async function and blocks — suitable for small module sets
  const p = aggregateModules(repoRoot);
  let result: any;
  let done = false;
  p.then((r) => {
    result = r;
    done = true;
  }).catch((e) => {
    throw e;
  });
  // spin-wait (acceptable in small dev scripts)
  const until = Date.now() + 5000;
  while (!done && Date.now() < until) {}
  if (!done)
    throw new Error(
      "aggregateModulesSync: timeout waiting for async aggregation"
    );
  return result as AggregationResult;
}
