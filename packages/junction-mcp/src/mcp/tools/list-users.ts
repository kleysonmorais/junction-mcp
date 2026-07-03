import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerListUsers(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "list_users",
    {
      title: "List Users",
      description:
        "List all users on the Junction sandbox team, including each user's user_id, " +
        "client_user_id (a readable handle like 'mcp_device_multi'), and connected data sources. " +
        "Call this first to discover which users exist and what devices they have connected.",
      inputSchema: {},
    },
    async () => {
      try {
        return jsonResult(await client.listUsers());
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
