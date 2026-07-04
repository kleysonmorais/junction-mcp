import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { dateTimeSchema, errorResult, jsonResult } from "./shared";

export function registerSearchLabResults(
  server: McpServer,
  client: JunctionClient,
) {
  server.registerTool(
    "search_lab_results",
    {
      title: "Search Lab Results",
      description:
        "Search completed lab results across the whole team, filtered by patient name, order id, or " +
        "client_user_id and/or a created-at date window. Each row summarizes one result: overall " +
        "interpretation (normal | abnormal | critical), whether results are missing, the patient, lab, " +
        "test, and the order's current status. " +
        "Use this to answer questions like 'show me abnormal results from last month' or 'find Maria's " +
        "latest results', then call get_lab_results with the order id for the full marker breakdown. " +
        "Returns a { data, next_cursor } envelope; pass next_cursor to page.",
      inputSchema: {
        search_input: z
          .string()
          .optional()
          .describe("Match patient name, order id, or client_user_id."),
        created_at_start: dateTimeSchema
          .optional()
          .describe("Only results created on/after this date (inclusive)."),
        created_at_end: dateTimeSchema
          .optional()
          .describe("Only results created on/before this date (inclusive)."),
        results_limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max results per page (default 10)."),
        next_cursor: z
          .string()
          .optional()
          .describe("Opaque cursor from a previous response's next_cursor, to fetch the next page."),
      },
    },
    async ({ search_input, created_at_start, created_at_end, results_limit, next_cursor }) => {
      try {
        return jsonResult(
          await client.searchResults({
            search_input,
            created_at_start,
            created_at_end,
            results_limit: results_limit ?? 10,
            next_cursor,
          }),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
