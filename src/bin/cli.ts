/**
 * BIN_CALL_PLACEHOLDER - DO NOT REMOVE
 */
/**
 * @description Decaf-ts' CLI entry point
 * @summary This file serves as the main executable entry point for the Decaf CLI. It creates a CliWrapper instance
 * and runs it with the process arguments. The CLI will crawl the current working directory for files called
 * MCP_FILE_NAME within the @decaf-ts namespace and load them as subcommands.
 *
 * @example
 * // Run a module command
 * $ npx decaf <module name> <module command> ...<module command options>
 *
 * // Get help for a specific module
 * $ npx decaf help <module name>
 *
 * // List all imported modules
 * $ npx decaf list
 *
 * // Get general CLI help
 * $ npx decaf help
 *
 * @memberOf module:MCP
 */

import { McpWrapper } from "../McpWrapper";
new McpWrapper()
  .run(process.argv)
  .then(() => {
    console.log("Thank you for using decaf-ts' mcp server");
  })
  .catch((e: unknown) => {
    console.error(`${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
