const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, "src", "modules");
const REQUIRED = ["prompts", "resources", "templates", "tools"];

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function readIfExists(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}
function findIndexFile(folder) {
  const candidates = ["index.ts", "index.js", "index.mjs", "index.cjs"];
  for (const c of candidates) {
    const p = path.join(folder, c);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function extractIdsFromText(text) {
  const ids = [];
  if (!text) return ids;
  const re = /id\s*:\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(text)) !== null) ids.push(m[1]);
  return ids;
}
function hasExport(text) {
  if (!text) return false;
  return (
    /\bexport\b/.test(text) ||
    /module\.exports/.test(text) ||
    /exports\./.test(text)
  );
}
function hasDisabledTrue(text) {
  if (!text) return false;
  return /disabled\s*:\s*true/.test(text);
}

function scan() {
  const report = { ok: true, modules: {}, duplicates: [] };
  if (!isDir(MODULES_DIR)) {
    report.ok = false;
    report.error = `Missing modules directory: ${MODULES_DIR}`;
    return report;
  }
  const modules = fs
    .readdirSync(MODULES_DIR)
    .filter((n) => isDir(path.join(MODULES_DIR, n)));
  const idMap = new Map();
  for (const mod of modules) {
    const modPath = path.join(MODULES_DIR, mod);
    const mreport = {
      path: modPath,
      folders: {},
      exports: {},
      ids: [],
      errors: [],
    };
    for (const f of REQUIRED) {
      const folderPath = path.join(modPath, f);
      if (!isDir(folderPath)) {
        mreport.folders[f] = "missing";
        mreport.errors.push(`Missing folder: ${f}`);
        report.ok = false;
        continue;
      } else {
        mreport.folders[f] = "ok";
      }
      const idx = findIndexFile(folderPath);
      if (!idx) {
        mreport.exports[f] = { file: null, exported: false };
        mreport.errors.push(`Missing index file in ${f}`);
        report.ok = false;
        continue;
      }
      const text = readIfExists(idx);
      const exported = hasExport(text);
      const disabled = hasDisabledTrue(text);
      const ids = extractIdsFromText(text);
      mreport.exports[f] = {
        file: path.relative(ROOT, idx),
        exported,
        disabled,
        ids,
      };
      if (!exported && !disabled) {
        mreport.errors.push(
          `No export found in ${f}/index and not explicitly disabled`
        );
        report.ok = false;
      }
      for (const id of ids) {
        if (!id) continue;
        if (!idMap.has(id)) idMap.set(id, []);
        idMap.get(id).push(mod);
      }
      mreport.ids.push(...ids);
    }
    report.modules[mod] = mreport;
  }
  for (const [id, mods] of idMap.entries()) {
    if (mods.length > 1) {
      report.duplicates.push({ id, modules: mods });
      report.ok = false;
    }
  }
  return report;
}

const out = scan();
fs.writeFileSync(
  "/tmp/validate-run.json",
  JSON.stringify(out, null, 2),
  "utf8"
);
console.log("/tmp/validate-run.json written");
