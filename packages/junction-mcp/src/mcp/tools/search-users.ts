import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerSearchUsers(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "search_users",
    {
      title: "Search Users",
      description:
        "Find users on this Junction team by a free-text query that matches against name, email, " +
        "phone number, client_user_id, or Junction user_id. Returns full demographics (name, dob, " +
        "gender, contact) and connected data sources for each match. " +
        "Prefer this over list_users when you already know something about the person " +
        "(e.g. 'find the user named Angela' or 'look up mcp.lab.standard@example.com') — " +
        "it filters server-side instead of dumping the whole team.",
      inputSchema: {
        search_input: z
          .string()
          .min(1)
          .describe(
            "Query matched against name, email, phone, client_user_id, or user_id. Required.",
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max users to return (default 30)."),
        order_key: z
          .enum([
            "created_on",
            "client_user_id",
            "first_name",
            "last_name",
            "email",
            "phone_number",
          ])
          .optional()
          .describe("Field to sort by (default created_on)."),
        order_direction: z
          .enum(["asc", "desc"])
          .optional()
          .describe("Sort direction (default asc)."),
      },
    },
    async ({ search_input, limit, order_key, order_direction }) => {
      try {
        return jsonResult(
          await client.searchUsers({
            search_input,
            limit: limit ?? 30,
            order_key,
            order_direction,
          }),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
