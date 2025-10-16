import { FastMCP } from "fastmcp";
import { PACKAGE_NAME as PKG, VERSION as V } from "../metadata";

export default function enrich(mcp: FastMCP): FastMCP {
  return mcp; // return mcp.addTool(...).addPrompt ... enrich the fastmcp wit the modules specific functionalities
}

export const PACKAGE_NAME = PKG;
export const VERSION = V;
