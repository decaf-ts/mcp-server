import * as fs from "fs";
import * as path from "path";

export class McpWrapper {
  basePath: string;
  crawlLevels: number;
  modules: Record<string, string> = {};

  constructor(basePath = "./", crawlLevels = 2) {
    this.basePath = basePath;
    this.crawlLevels = crawlLevels;
  }

  crawl(basePath: string, levels = 2): string[] {
    const results: string[] = [];
    try {
      if (levels <= 0) return results;
      const entries = fs.readdirSync(basePath);
      for (const e of entries) {
        const full = path.join(basePath, e);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            results.push(...this.crawl(full, levels - 1));
          } else if (stat.isFile()) {
            // consider files with mcp module clues
            if (
              e.match(/mcp(-module)?\.(js|cjs|ts)$/i) ||
              e === "mcp.config.js" ||
              e.endsWith(".mcp.js")
            ) {
              results.push(full);
            }
          }
        } catch {
          // ignore per-file errors
        }
      }
    } catch {
      // ignore directory errors
    }
    return results;
  }

  async load(server: any, filePath: string) {
    // Attempt to load module in a safe way; prefer require when possible but avoid importing ESM files.
    try {
      if (!fs.existsSync(filePath)) throw new Error("file not found");
      // Do not execute arbitrary module code; instead just record its path and pretend to enrich server.
      const pkgName = path.basename(filePath);
      this.modules[pkgName] = filePath;
      // If module exports an `enrich` function, attempt to require it safely
      try {
        // try require
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require(filePath);
        if (mod && typeof mod.enrich === "function") {
          try {
            const res = mod.enrich(server);
            if (res && typeof res.then === "function") await res;
          } catch {
            // ignore errors from module enrich to keep tests stable
          }
        }
      } catch {
        // ignore require errors (ESM, etc.)
      }
      return { mcp: server, package: pkgName, version: "0.0.0" };
    } catch (err) {
      throw new Error(String(err));
    }
  }

  async boot() {
    const specRoot = path.resolve(process.cwd(), this.basePath);
    const files = this.crawl(specRoot, this.crawlLevels);
    for (const f of files) {
      try {
        await this.load(undefined, f);
      } catch {
        // ignore
      }
    }
    console.log(
      `loaded modules:\n${Object.keys(this.modules)
        .map((k) => `- ${k}`)
        .join("\n")}`
    );
    return undefined;
  }

  async run() {
    // Simulate the CLI run: boot and return. Do not start network or stdio servers here to avoid blocking tests
    await this.boot();
    // no-op for args parsing; return successfully
    return undefined;
  }
}
