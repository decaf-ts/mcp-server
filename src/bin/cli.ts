import { createServer } from "../mcp";

export async function runCli(args: string[] = process.argv.slice(2)) {
  void args;
  const server = createServer({ name: "@decaf-ts/mcp-server" });
  await server.startStdio();
}

if (require.main === module) {
  // If executed directly (ts-node), start the CLI
  void runCli(process.argv.slice(2)).catch((err) => {
    console.error("CLI failed:", err);
    process.exit(1);
  });
}
