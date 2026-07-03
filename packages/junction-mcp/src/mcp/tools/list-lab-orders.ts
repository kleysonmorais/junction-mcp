import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult, userIdSchema } from "./shared";

export function registerListLabOrders(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "list_lab_orders",
    {
      title: "List Lab Orders",
      description:
        "List lab orders placed on this Junction team, optionally filtered to one user. " +
        "Each order includes its id, status (namespaced like 'completed.testkit.completed' or " +
        "'collecting_sample.testkit.transit_customer'), collection method, lab test, and patient. " +
        "Use get_lab_results on completed orders to read the actual results.",
      inputSchema: {
        user_id: userIdSchema.optional().describe("Filter to a single user's orders."),
        page: z.number().int().min(1).optional().describe("Page number (default 1)."),
        size: z.number().int().min(1).max(50).optional().describe("Page size (default 50, max 50)."),
      },
    },
    async ({ user_id, page, size }) => {
      try {
        return jsonResult(await client.listOrders({ user_id, page, size: size ?? 50 }));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
