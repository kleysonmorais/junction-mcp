import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { JunctionClient } from "../junction/client";
import { registerGetLabOrder } from "./tools/get-lab-order";
import { registerGetLabResults } from "./tools/get-lab-results";
import { registerGetUserConnections } from "./tools/get-user-connections";
import { registerGetWearableSummary } from "./tools/get-wearable-summary";
import { registerGetWearableTimeseries } from "./tools/get-wearable-timeseries";
import { registerListLabOrders } from "./tools/list-lab-orders";
import { registerListLabTests } from "./tools/list-lab-tests";
import { registerListUsers } from "./tools/list-users";
import { registerSearchLabMarkers } from "./tools/search-lab-markers";
import { registerSearchLabResults } from "./tools/search-lab-results";
import { registerSearchLabTests } from "./tools/search-lab-tests";
import { registerSearchUsers } from "./tools/search-users";

export const SERVER_INFO = { name: "junction-mcp", version: "0.1.0" };

/**
 * Register the full v1 tool set on an MCP server.
 *
 * Transport-agnostic: called from the Streamable HTTP route handlers
 * (/mcp, /mcp-demo) and the local stdio entry point alike. The Junction key
 * is bound here — per caller on /mcp, from env on /mcp-demo and stdio.
 */
export function registerJunctionTools(server: McpServer, apiKey: string) {
  const client = new JunctionClient({
    apiKey,
    baseUrl: process.env.JUNCTION_BASE_URL,
  });

  registerListUsers(server, client);
  registerSearchUsers(server, client);
  registerGetUserConnections(server, client);
  registerGetWearableSummary(server, client);
  registerGetWearableTimeseries(server, client);
  registerListLabTests(server, client);
  registerSearchLabTests(server, client);
  registerSearchLabMarkers(server, client);
  registerListLabOrders(server, client);
  registerGetLabOrder(server, client);
  registerGetLabResults(server, client);
  registerSearchLabResults(server, client);
}
