import { Command } from "commander";
import { FastMCP } from "fastmcp";

/**
 * @description Demo CLI module for Decaf libraries
 * @summary A minimal implementation showing how to extend the Decaf CLI with custom commands.
 * This module demonstrates the pattern for creating CLI modules that can be discovered and loaded by the Decaf CLI.
 *
 * @return {Command} The Command object to be added to the main Decaf CLI
 *
 * @function demo
 * @memberOf module:CLI
 *
 * @example
 * // Run the demo command with an argument
 * npx decaf demo command "something something"
 *
 * // Output:
 * // executed demo command with type variable: something something
 *
 * @mermaid
 * sequenceDiagram
 *   participant User
 *   participant CLI
 *   participant DemoModule
 *   participant Command
 *
 *   User->>CLI: npx decaf demo command "arg"
 *   CLI->>DemoModule: Load module
 *   DemoModule->>Command: Create command
 *   Command->>Command: Configure action
 *   Command-->>DemoModule: Return command
 *   DemoModule-->>CLI: Return command
 *   CLI->>Command: Execute with args
 *   Command->>Console: Log output
 */
export default function demo(): FastMCP {
  return new Command()
    .command("command <type>")
    .description("A demo command")
    .action((args: string) => {
      console.log(`executed demo command with type variable: ${args}`);
    });
}
