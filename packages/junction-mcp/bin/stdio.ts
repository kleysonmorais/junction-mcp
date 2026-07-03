#!/usr/bin/env node
/**
 * Local stdio entry point — run the same Junction MCP server inside a local
 * MCP client (Claude Desktop, MCP Inspector) without deploying anything.
 *
 * The client spawns this as a subprocess and supplies the key via env:
 *
 *   {
 *     "mcpServers": {
 *       "junction": {
 *         "command": "npx",
 *         "args": ["-y", "tsx", "/path/to/junction-mcp/bin/stdio.ts"],
 *         "env": { "JUNCTION_API_KEY": "sk_us_..." }
 *       }
 *     }
 *   }
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerJunctionTools, SERVER_INFO } from "../lib/mcp/server";

async function main() {
  const apiKey = process.env.JUNCTION_API_KEY;
  if (!apiKey) {
    // stderr only — stdout belongs to the MCP protocol.
    console.error(
      "junction-mcp: missing JUNCTION_API_KEY. Set it in your MCP client config's env block.",
    );
    process.exit(1);
  }

  const server = new McpServer(SERVER_INFO);
  registerJunctionTools(server, apiKey);
  await server.connect(new StdioServerTransport());
  console.error(`junction-mcp v${SERVER_INFO.version} ready on stdio`);
}

main().catch((err) => {
  console.error("junction-mcp: fatal:", err);
  process.exit(1);
});
