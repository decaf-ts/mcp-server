#!/usr/bin/env node
// CommonJS module validator for src/modules
const fs = require('fs');
const path = require('path');

const REQUIRED = ['prompts', 'resources', 'templates', 'tools'];

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function listModuleDirectories(workspaceRoot) {
  const modulesDir = path.join(workspaceRoot, 'src', 'modules');
  if (!isDir(modulesDir)) return [];
  return fs.readdirSync(modulesDir).filter((name) => {
    const p = path.join(modulesDir, name);
    return isDir(p);
  });
}

function validateModuleScaffolding(workspaceRoot = process.cwd()) {
  const issues = [];
  const modules = listModuleDirectories(workspaceRoot);

  // gather module packages if a modules/index exists (attempt to parse minimal ids)
  let manifest = {};
  try {
    const manifestPath = path.join(workspaceRoot, 'src', 'modules', 'index.ts');
    if (fs.existsSync(manifestPath)) {
      const txt = fs.readFileSync(manifestPath, 'utf8');
      // crude parse for exported module names like export const modulePackages = [ { name: 'x' ... }]
      const re = /name\s*:\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = re.exec(txt)) !== null) {
        manifest[m[1]] = true;
      }
    }
  } catch (e) {
    // ignore
  }

  for (const moduleName of modules) {
    for (const folder of REQUIRED) {
      const folderPath = path.join(workspaceRoot, 'src', 'modules', moduleName, folder);
      if (!isDir(folderPath)) {
        issues.push({ type: 'missing-folder', module: moduleName, detail: `Missing ${folder} directory at ${folderPath}`, severity: 'error' });
        continue;
      }
      const indexTs = path.join(folderPath, 'index.ts');
      const indexJs = path.join(folderPath, 'index.js');
      const indexCjs = path.join(folderPath, 'index.cjs');
      const idx = fs.existsSync(indexTs) ? indexTs : (fs.existsSync(indexJs) ? indexJs : (fs.existsSync(indexCjs) ? indexCjs : null));
      if (!idx) {
        issues.push({ type: 'missing-export', module: moduleName, detail: `Expected ${folder}/index.* export for module ${moduleName}`, severity: 'error' });
        continue;
      }
      const text = fs.readFileSync(idx, 'utf8');
      const exported = /\bexport\b/.test(text) || /module\.exports/.test(text) || /exports\./.test(text);
      const disabled = /disabled\s*:\s*true/.test(text);
      if (!exported && !disabled) {
        issues.push({ type: 'no-export', module: moduleName, detail: `No export found in ${folder}/index and not explicitly disabled`, severity: 'error' });
      }
    }

    if (!manifest[moduleName]) {
      issues.push({ type: 'not-registered', module: moduleName, detail: `Module ${moduleName} is not registered in src/modules/index.ts`, severity: 'error' });
    }
  }

  // Check for empty assets in manifest parsing (best-effort)
  // Attempt to locate module package definitions under src/modules - naive scan for ids
  const idMap = new Map();
  for (const moduleName of modules) {
    for (const folder of REQUIRED) {
      const folderPath = path.join(workspaceRoot, 'src', 'modules', moduleName, folder);
      const idx = [path.join(folderPath,'index.ts'), path.join(folderPath,'index.js'), path.join(folderPath,'index.cjs')].find(fs.existsSync);
      if (!idx) continue;
      const text = fs.readFileSync(idx, 'utf8');
      const re = /id\s*:\s*['"`]([^'"`]+)['"`]/g;
      let m;
      while ((m = re.exec(text)) !== null) {
        const id = m[1];
        if (!id) continue;
        if (!idMap.has(id)) idMap.set(id, []);
        idMap.get(id).push(moduleName);
      }
    }
  }
  for (const [id, mods] of idMap.entries()) {
    if (mods.length > 1) {
      issues.push({ type: 'duplicate-id', detail: `Duplicate id ${id} in modules: ${mods.join(', ')}`, modules: mods, severity: 'error' });
    }
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return { issues, hasErrors };
}

function assertModuleScaffolding(workspaceRoot = process.cwd()) {
  const { issues, hasErrors } = validateModuleScaffolding(workspaceRoot);
  if (hasErrors) {
    const details = issues.filter((i) => i.severity === 'error').map((i) => `- [${i.module||'?'}] ${i.detail}`).join('\n');
    const err = new Error(`Module validation failed:\n${details}`);
    err.issues = issues;
    throw err;
  }
  return issues;
}

module.exports = { validateModuleScaffolding, assertModuleScaffolding };
