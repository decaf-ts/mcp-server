import { FastMCP } from "fastmcp";
import * as Prompts from "./prompts";
import * as Tools from "./tools";
import * as Resources from "./resources";

export function EnrichCore(server: FastMCP) {
  Prompts.forEach((prompt) => server.addPrompt(prompt));
  Tools.forEach((tool) => server.addTool(tool));
  Resources.forEach((resource) => server.addResource(resource));
}
