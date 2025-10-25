import { Logger, Logging } from "@decaf-ts/logging";
import { style } from "styled-string-builder";
import path from "path";
import fs from "fs";

const colors = [
  "\x1b[38;5;215m", // soft orange
  "\x1b[38;5;209m", // coral
  "\x1b[38;5;205m", // pink
  "\x1b[38;5;210m", // peachy
  "\x1b[38;5;217m", // salmon
  "\x1b[38;5;216m", // light coral
  "\x1b[38;5;224m", // light peach
  "\x1b[38;5;230m", // soft cream
  "\x1b[38;5;230m", // soft cream
];

export function getSlogan(): string {
  // Find nearest node_modules from this file's directory to survive bundling
  const startDir = __dirname;
  let current: string | undefined = startDir;
  let nodeModulesDir: string | undefined;

  try {
    while (current && current !== path.parse(current).root) {
      const candidate = path.join(current, "node_modules");
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        nodeModulesDir = candidate;
        break;
      }
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  } catch {
    // ignore errors during traversal
  }

  const slogans: string[] = [];

  if (nodeModulesDir) {
    const scopeDir = path.join(nodeModulesDir, "@decaf-ts");
    try {
      if (fs.existsSync(scopeDir) && fs.statSync(scopeDir).isDirectory()) {
        const pkgs = fs.readdirSync(scopeDir);
        for (const pkg of pkgs) {
          const depPath = path.join(scopeDir, pkg);
          try {
            const slogansPath = path.join(
              depPath,
              "workdocs",
              "assets",
              "slogans.json"
            );
            if (
              fs.existsSync(slogansPath) &&
              fs.statSync(slogansPath).isFile()
            ) {
              const raw = fs.readFileSync(slogansPath, "utf-8");
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                for (const s of parsed) {
                  if (typeof s === "string" && s.trim().length > 0) {
                    slogans.push(s.trim());
                  }
                }
              }
            }
          } catch {
            // ignore per-package errors
          }
        }
      }
    } catch {
      // ignore scope directory errors
    }
  }

  if (slogans.length === 0) {
    return "Decaf: strongly brewed TypeScript.";
  }
  const idx = Math.floor(Math.random() * slogans.length);
  return slogans[idx];
}

export function printBanner(logger: Logger = Logging.get()) {
  let message: string;
  try {
    message = getSlogan();
  } catch {
    message = "Decaf: strongly brewed TypeScript.";
  }
  const banner: string | string[] =
    `#                 ░▒▓███████▓▒░  ░▒▓████████▓▒░  ░▒▓██████▓▒░   ░▒▓██████▓▒░  ░▒▓████████▓▒░       ░▒▓████████▓▒░  ░▒▓███████▓▒░ 
#      ( (        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░                 ░▒▓█▓▒░     ░▒▓█▓▒░        
#       ) )       ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░                 ░▒▓█▓▒░     ░▒▓█▓▒░        
#    [=======]    ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓██████▓▒░   ░▒▓█▓▒░        ░▒▓████████▓▒░ ░▒▓██████▓▒░            ░▒▓█▓▒░      ░▒▓██████▓▒░  
#     \`-----´     ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░                 ░▒▓█▓▒░            ░▒▓█▓▒░ 
#                 ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░        ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░                 ░▒▓█▓▒░            ░▒▓█▓▒░ 
#                 ░▒▓███████▓▒░  ░▒▓████████▓▒░  ░▒▓██████▓▒░  ░▒▓█▓▒░░▒▓█▓▒░ ░▒▓█▓▒░                 ░▒▓█▓▒░     ░▒▓███████▓▒░  
#`.split("\n");
  const maxLength = banner.reduce((max, line) => Math.max(max, line.length), 0);
  banner.push(`#  ${message.padStart(maxLength - 3)}`);
  banner.forEach((line, index) => {
    const color = colors[index % colors.length] || "";
    const logFn = logger ? logger.info.bind(logger) : console.log.bind(console);
    try {
      const msg = style(line || "").raw(color).text;
      logFn(msg);
    } catch {
      // Fallback to plain output if styling fails for any reason
      logFn(String(line || ""));
    }
  });
}
