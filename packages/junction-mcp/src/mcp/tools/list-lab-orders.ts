import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { dateTimeSchema, errorResult, jsonResult, userIdSchema } from "./shared";

export function registerListLabOrders(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "list_lab_orders",
    {
      title: "List Lab Orders",
      description:
        "List lab orders placed on this Junction team. Filter by user_id, by a free-text search_input " +
        "(matches patient name, DOB, email, user ID, client user ID, order ID, or order transaction ID), " +
        "and/or by created or updated date windows. " +
        "Each order includes its id, status (namespaced like 'completed.testkit.completed' or " +
        "'collecting_sample.testkit.transit_customer'), collection method, lab test, and patient. " +
        "Returns a { orders, total, page, size } envelope. " +
        "Use get_lab_results on completed orders to read the actual results, or search_lab_results to " +
        "search results across patients.",
      inputSchema: {
        user_id: userIdSchema.optional().describe("Filter to a single user's orders."),
        search_input: z
          .string()
          .optional()
          .describe("Match patient name, DOB, email, user/client id, order id, or order transaction id."),
        start_date: dateTimeSchema
          .optional()
          .describe("Only orders created on/after this date. 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'."),
        end_date: dateTimeSchema
          .optional()
          .describe("Only orders created on/before this date."),
        updated_start_date: dateTimeSchema
          .optional()
          .describe("Only orders last updated on/after this date."),
        updated_end_date: dateTimeSchema
          .optional()
          .describe("Only orders last updated on/before this date."),
        page: z.number().int().min(1).optional().describe("Page number (default 1)."),
        size: z.number().int().min(1).max(50).optional().describe("Page size (default 50, max 50)."),
      },
    },
    async ({
      user_id,
      search_input,
      start_date,
      end_date,
      updated_start_date,
      updated_end_date,
      page,
      size,
    }) => {
      try {
        return jsonResult(
          await client.listOrders({
            user_id,
            search_input,
            start_date,
            end_date,
            updated_start_date,
            updated_end_date,
            page,
            size: size ?? 50,
          }),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
