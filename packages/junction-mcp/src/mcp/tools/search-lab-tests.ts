import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerSearchLabTests(
  server: McpServer,
  client: JunctionClient,
) {
  server.registerTool(
    "search_lab_tests",
    {
      title: "Search Lab Tests",
      description:
        "Search the orderable lab-test catalog by name — each result includes the test's id, name, " +
        "collection method (testkit, walk_in_test, at_home_phlebotomy), sample type, lab, price, " +
        "fasting requirement, and included markers. " +
        "Prefer this over list_lab_tests to find a specific test (e.g. 'lipid panel', 'CMP') without " +
        "pulling the entire catalog. Returns a { data, next_cursor } envelope.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("Case-insensitive substring of the test name (e.g. 'lipid')."),
        status: z
          .enum(["active", "inactive"])
          .optional()
          .describe("Filter by test status (default: all)."),
        lab_test_limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Max tests to return (default 10)."),
      },
    },
    async ({ name, status, lab_test_limit }) => {
      try {
        return jsonResult(
          await client.searchLabTests({
            name,
            status,
            lab_test_limit: lab_test_limit ?? 10,
          }),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
