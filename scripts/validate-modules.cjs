#!/usr/bin/env node
// @ts-nocheck
const path = require("path");
const fs = require("fs");
const vm = require("vm");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// Try to use ts-node first (dev environments)
try {
  require("ts-node").register({ transpileOnly: true });
} catch (e) {
  // ignore, will try fallback
}

async function loadValidator(modulePath) {
  // If compiled JS exists under lib, prefer that
  const compiled = path.join(
    process.cwd(),
    "lib",
    modulePath.replace(/\.ts$/, ".cjs")
  );
  if (fs.existsSync(compiled)) {
    return require(compiled);
  }

  // Try requiring the TS file directly (ts-node may have registered)
  try {
    return require(modulePath);
  } catch (err) {
    // Fallback: transpile TypeScript to CommonJS using TypeScript compiler API
    try {
      const ts = require("typescript");
      const content = fs.readFileSync(modulePath, "utf8");
      const transpiled = ts.transpileModule(content, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.React,
          esModuleInterop: true,
        },
        fileName: modulePath,
      });
      const script = new vm.Script(transpiled.outputText, {
        filename: modulePath,
      });
      const module = { exports: {} };
      const dirname = path.dirname(modulePath);
      const sandboxRequire = require;
      const wrapper = `(function(exports, require, module, __filename, __dirname){\n${transpiled.outputText}\n});`;
      const wrapped = new vm.Script(wrapper, { filename: modulePath });
      const func = wrapped.runInThisContext();
      func(module.exports, sandboxRequire, module, modulePath, dirname);
      return module.exports;
    } catch (e2) {
      throw err; // rethrow original require error for clarity
    }
  }
}

(async function main() {
  try {
    // Basic argv parsing: support --json-out <file>
    const argv = process.argv.slice(2);
    let jsonOut = null;
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === "--json-out" && argv[i + 1]) {
        jsonOut = argv[i + 1];
        i++;
      }
    }
    const validator = await loadValidator(
      path.join(__dirname, "..", "src", "mcp", "validation", "index.ts")
    );
    const report = validator.validateModules(process.cwd());
    if (!report.ok) {
      console.error("Module validation failed:");
      console.error(JSON.stringify(report, null, 2));
      if (jsonOut) {
        try {
          fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), "utf8");
          console.error(`Wrote validation report to ${jsonOut}`);
        } catch (e) {
          console.error(
            "Failed to write JSON report:",
            e && e.message ? e.message : e
          );
        }
      }
      process.exit(2);
    }
    console.log("Module validation passed");
    if (jsonOut) {
      try {
        fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2), "utf8");
        console.log(`Wrote validation report to ${jsonOut}`);
      } catch (e) {
        console.error(
          "Failed to write JSON report:",
          e && e.message ? e.message : e
        );
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(
      "Error executing module validator:",
      err && err.stack ? err.stack : err
    );
    process.exit(3);
  }
})();
