import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerListLabTests(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "list_lab_tests",
    {
      title: "List Lab Tests",
      description:
        "List the lab tests available on this Junction team — each with its id, name, collection method " +
        "(testkit, walk_in_test, at_home_phlebotomy), sample type, and included markers. " +
        "This is the catalog of orderable tests, not placed orders (see list_lab_orders for those).",
      inputSchema: {},
    },
    async () => {
      try {
        return jsonResult(await client.listLabTests());
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
