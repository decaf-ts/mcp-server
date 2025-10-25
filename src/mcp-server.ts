import { LoggedClass } from "@decaf-ts/logging";
import { McpServer as MCP } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PACKAGE_NAME, VERSION } from "./version";
import { printBanner } from "./utils/banner";
import { Loader } from "./loader";
import { Tools } from "./tools";
import { Prompts } from "./prompts";
import { Resources } from "./resources";

export class McpServer extends LoggedClass {
  private _mcp?: MCP;

  private loader = new Loader();

  protected get client() {
    if (!this._mcp) throw new Error("Mcp server requires Mcp client");
    return this._mcp;
  }

  constructor() {
    super();
  }

  protected load() {
    this.loader.loadResources(this.client, Resources);
    this.loader.loadPrompts(this.client, Prompts);
    this.loader.loadTools(this.client, Tools);
  }

  boot() {
    this.log.for(this.boot).info("McpServer booting...");
    printBanner(this.log);
    this._mcp = new MCP({
      name: PACKAGE_NAME,
      title: "",
      websiteUrl: "",
      version: VERSION,
      instructions: "",
      capabilities: {
        logging: {},
        completions: {},
        resources: {
          subscribe: false,
          listChanged: false,
        },
        tools: {
          listChanged: false,
        },
        prompts: {
          listChanged: false,
        },
      },
      icons: [
        {
          src: "workdocs/assets/favicon.svg",
          mimeType: "image/svg+xml",
          sizes: ["any"],
        },
      ],
    });
    this.load();
  }
}
