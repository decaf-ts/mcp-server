import { Server } from "@modelcontextprotocol/sdk/server";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MCP_FILE_NAME } from "./constants";

/**
 * @description Function type for Decaf MCP modules
 * @summary Defines the signature for MCP module functions that each Decaf module must export under the MCP_FILE_NAME file
 * The function should return a Server object or a Promise that resolves to a Server object
 *
 * @typedef {Function} McpModule
 * @return {Server|Promise<Server>} A Command object or Promise that resolves to a Server object
 * @memberOf module:CLI
 */
export type McpModule = () => Server | Promise<Server>;
