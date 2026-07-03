import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult, userIdSchema } from "./shared";

export function registerGetUserConnections(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "get_user_connections",
    {
      title: "Get User Device Connections",
      description:
        "List the wearable/device providers connected for a user (e.g. fitbit, oura, freestyle_libre), " +
        "including connection status and which data resources each provider supplies. " +
        "Useful to check what wearable data is available before querying summaries or timeseries.",
      inputSchema: { user_id: userIdSchema },
    },
    async ({ user_id }) => {
      try {
        return jsonResult(await client.getUserConnections(user_id));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
