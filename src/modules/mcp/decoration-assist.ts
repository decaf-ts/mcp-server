import type { FastMCP } from "fastmcp";
import enrich from "../../mcp/mcp-module";

export default function decorationAssist(server: FastMCP): FastMCP {
  return enrich(server);
}

export { enrich };
