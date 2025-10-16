/* istanbul ignore file */
import fs from "fs";
import path from "path";
import { MCP_FILE_NAME } from "./constants";
import { McpUtils } from "./utils";
import { FastMCP } from "fastmcp";
import { LoggedClass } from "@decaf-ts/logging";
import { VERSION } from "./metadata";

/**
 * @description Utility class to handle CLI functionality from all Decaf modules
 * @summary This class provides a wrapper around Commander.js to handle CLI commands from different Decaf modules.
 * It crawls the filesystem to find CLI modules, loads them, and registers their commands.
 *
 * @param {string} [basePath] The base path to look for modules in. Defaults to `./`
 * @param {number} [crawlLevels] Number of folder levels to crawl to find modules from the basePath. Defaults to 4
 *
 * @example
 * // Create a new CLI wrapper and run it with custom options
 * const cli = new CliWrapper('./src', 2);
 * cli.run(process.argv).then(() => {
 *   console.log('CLI commands executed successfully');
 * });
 *
 * @class McpWrapper
 */
export class McpWrapper extends LoggedClass {
  private _mcp?: FastMCP;
  private modules: Record<string, string> = {};
  private readonly rootPath: string;

  constructor(
    private basePath: string = "./",
    private crawlLevels = 4
  ) {
    super();
    this.rootPath = path.resolve(__dirname, "..");
  }

  /**
   * @description Retrieves and initializes the Commander Command object
   * @summary Lazy-loads the Command object, initializing it with the package name, description, and version
   * @return {Command} The initialized Command object
   * @private
   */
  private get mcp() {
    if (!this._mcp) {
      this._mcp = new FastMCP({
        name: "decaf-ts MCP server",
        instructions: "",
        version: VERSION as any,
      });
    }
    return this._mcp;
  }

  /**
   * @description Loads and registers an mcp extension module from a file
   * @summary Dynamically imports an mcp extension module from the specified file path, initializes it, and registers it in the modules collection
   *
   */
  private async load(
    server: FastMCP,
    filePath: string
  ): Promise<{ mcp: FastMCP; package: string; version: string }> {
    const log = this.log.for(this.load);

    let pkg: string, version: string, enrich: any;
    try {
      const res = await McpUtils.loadFromFile(filePath);
      pkg = res.PACKAGE_NAME;
      version = res.VERSION;
      enrich = res.enrich;
    } catch (e: unknown) {
      throw new Error((e as any).message || (e as any));
    }
    try {
      log.info(`Enriching mcp server with module ${pkg} v${version}`);
      const result = enrich(server);
      server = result instanceof Promise ? await result : result;
    } catch (e: unknown) {
      throw new Error(
        `failed to enrich mcp with module ${pkg || "unnamed"} under ${filePath}: ${e instanceof Error ? e.message : e}`
      );
    }
    return {
      mcp: server,
      package: pkg,
      version: version,
    };
  }

  /**
   * @description Finds and loads all CLI modules in the basePath
   * @summary Uses the crawl method to find all CLI modules in the specified base path,
   * then loads and registers each module as a subcommand
   *
   * @return {Promise<void>} A promise that resolves when all modules are loaded
   *
   * @private
   * @mermaid
   * sequenceDiagram
   *   participant CliWrapper
   *   participant Filesystem
   *   participant Module
   *
   *   CliWrapper->>Filesystem: Join basePath with cwd
   *   CliWrapper->>CliWrapper: crawl(basePath, crawlLevels)
   *   CliWrapper-->>CliWrapper: modules[]
   *   loop For each module
   *     alt Not @decaf-ts/cli
   *       CliWrapper->>CliWrapper: load(module, cwd)
   *       CliWrapper-->>CliWrapper: name
   *       CliWrapper->>CliWrapper: Check if command exists
   *       alt Command doesn't exist
   *         CliWrapper->>Command: command(name).addCommand(modules[name])
   *       end
   *     end
   *   end
   *   CliWrapper->>Console: Log loaded modules
   */
  private async boot() {
    const log = this.log.for(this.boot);

    const basePath = path.resolve(this.rootPath, this.basePath);
    const modules = this.crawl(basePath, this.crawlLevels);
    let server = this.mcp;
    for (const module of modules) {
      if (module.includes("@decaf-ts/mcp")) {
        continue;
      }
      try {
        const res = await this.load(server, module);
        server = res.mcp;
      } catch (e: unknown) {
        log.error(`Failed to load MCP configs for ${module}: ${e}`);
      }
    }
    console.log(
      `loaded modules:\n${Object.keys(this.modules)
        .map((k) => `- ${k}`)
        .join("\n")}`
    );
  }

  /**
   * @description Recursively searches for CLI module files in the directory structure
   * @summary Crawls the basePath up to the specified number of folder levels to find files named according to CLI_FILE_NAME
   *
   * @param {string} basePath The absolute base path to start searching in
   * @param {number} [levels=2] The maximum number of directory levels to crawl
   * @return {string[]} An array of file paths to CLI modules
   *
   * @private
   */
  private crawl(basePath: string, levels: number = 2) {
    if (levels <= 0) return [];
    return fs.readdirSync(basePath).reduce((accum: string[], file) => {
      file = path.join(basePath, file);
      if (fs.statSync(file).isDirectory()) {
        accum.push(...this.crawl(file, levels - 1));
      } else if (file.match(new RegExp(`${MCP_FILE_NAME}.[cm]?js$`, "gm"))) {
        accum.push(file);
      }
      return accum;
    }, []);
  }

  /**
   * @description Executes the CLI with the provided arguments
   * @summary Boots the CLI by loading all modules, then parses and executes the command specified in the arguments
   *
   * @param {string[]} [args=process.argv] Command line arguments to parse and execute
   * @return {Promise<void>} A promise that resolves when the command execution is complete
   *
   * @mermaid
   * sequenceDiagram
   *   participant Client
   *   participant CliWrapper
   *   participant Command
   *
   *   Client->>CliWrapper: run(args)
   *   CliWrapper->>CliWrapper: boot()
   *   Note over CliWrapper: Loads all modules
   *   CliWrapper->>Command: parseAsync(args)
   *   Command-->>CliWrapper: result
   *   CliWrapper-->>Client: result
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(args: string[] = process.argv) {
    await this.boot();
  }
}
