import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { JunctionClient } from "../../junction/client";
import { errorResult, jsonResult } from "./shared";

export function registerSearchLabMarkers(
  server: McpServer,
  client: JunctionClient,
) {
  server.registerTool(
    "search_lab_markers",
    {
      title: "Search Lab Markers",
      description:
        "Search the marker and panel compendium by name — the individual analytes labs report " +
        "(e.g. 'glucose', 'cholesterol', 'TSH'). Each marker carries its LOINC code, unit, type " +
        "(biomarker or panel), lab, provider_id, and the expected results it yields. " +
        "Use this to answer 'which tests measure X?' or to find the provider_id / marker_id needed " +
        "to build a custom lab test. Returns a { markers, total, page, size, pages } envelope; " +
        "this response can be large, so keep size modest.",
      inputSchema: {
        name: z
          .string()
          .optional()
          .describe("Case-insensitive substring of the marker name (e.g. 'glucose')."),
        page: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe("Page number (default 1)."),
        size: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Page size (default 10, max 50). Markers are verbose — keep this small."),
      },
    },
    async ({ name, page, size }) => {
      try {
        return jsonResult(
          await client.searchLabMarkers({ name, page: page ?? 1, size: size ?? 10 }),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
