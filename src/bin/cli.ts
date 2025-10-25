import { McpServer } from "../mcp-server";

async function main() {
  const server = new McpServer();
  return server.boot();
}

main();
