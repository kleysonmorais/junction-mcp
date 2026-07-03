import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerGetLabOrder(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "get_lab_order",
    {
      title: "Get Lab Order",
      description:
        "Fetch a single lab order by id: current lifecycle status, status event history, collection method, " +
        "lab test details, patient details, and shipping/tracking where applicable. " +
        "Use this to answer 'where is this order?' — statuses read high-level.modality.detail, e.g. " +
        "'collecting_sample.testkit.transit_customer' means the kit is on its way to the patient.",
      inputSchema: {
        order_id: z.string().uuid().describe("Lab order id (UUID) — discover via list_lab_orders."),
      },
    },
    async ({ order_id }) => {
      try {
        return jsonResult(await client.getOrder(order_id));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
