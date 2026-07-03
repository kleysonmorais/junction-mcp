import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerGetLabResults(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "get_lab_results",
    {
      title: "Get Lab Results",
      description:
        "Fetch structured results for a completed lab order: each marker with its name, numeric value, unit, " +
        "reference range (min/max), out-of-range flags, and interpretation (normal | abnormal | critical), " +
        "plus report metadata (patient, laboratory, dates) and any missing results. " +
        "Only completed orders have results — check status via get_lab_order or list_lab_orders first.",
      inputSchema: {
        order_id: z.string().uuid().describe("Lab order id (UUID) — discover via list_lab_orders."),
      },
    },
    async ({ order_id }) => {
      try {
        return jsonResult(await client.getOrderResults(order_id));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
