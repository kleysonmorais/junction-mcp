import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SUMMARY_RESOURCES, type JunctionClient } from "../../junction/client";
import {
  checkDateRange,
  dateSchema,
  errorResult,
  jsonResult,
  textError,
  todayISO,
  userIdSchema,
} from "./shared";

export function registerGetWearableSummary(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "get_wearable_summary",
    {
      title: "Get Wearable Summary Data",
      description:
        "Fetch aggregated wearable data for a user over a date range (max 31 days). " +
        "Resources: 'activity' (one object per day: calories, steps, distance), " +
        "'sleep' (one object per sleep session: duration, stages, efficiency, resting HR, HRV average), " +
        "'sleep_cycle' (per sleep-cycle-stage breakdown within a session), " +
        "'workouts' (one object per workout: sport, duration, heart rate zones, distance), " +
        "'body' (weight and body-fat measurements), " +
        "'meal' (per-meal nutrition entries), " +
        "'menstrual_cycle' (per cycle-day tracking), " +
        "'electrocardiogram' (per ECG recording session). " +
        "All resources except 'profile' are session- or daily-granularity; use get_wearable_timeseries for intraday samples. " +
        "Data comes from the user's connected providers (Fitbit, Oura, etc.).",
      inputSchema: {
        user_id: userIdSchema,
        resource: z.enum(SUMMARY_RESOURCES).describe("Which summary resource to fetch."),
        start_date: dateSchema.describe("Range start, YYYY-MM-DD."),
        end_date: dateSchema
          .optional()
          .describe("Range end, YYYY-MM-DD. Defaults to today."),
      },
    },
    async ({ user_id, resource, start_date, end_date }) => {
      const end = end_date ?? todayISO();
      const rangeProblem = checkDateRange(start_date, end);
      if (rangeProblem) return textError(rangeProblem);
      try {
        return jsonResult(await client.getSummary(resource, user_id, start_date, end));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
