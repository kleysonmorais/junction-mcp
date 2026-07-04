import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TIMESERIES_RESOURCES, type JunctionClient } from "../../junction/client";
import {
  checkDateRange,
  dateSchema,
  errorResult,
  jsonResult,
  textError,
  todayISO,
  userIdSchema,
} from "./shared";

/**
 * Junction returns provider data unsampled — heartrate/hrv can be minute-level
 * (tens of thousands of points per month). Cap what one tool call feeds an LLM,
 * downsampling evenly so the shape of the curve survives.
 */
const MAX_SAMPLES = 400;

interface Sample {
  timestamp: string;
  value: number;
  unit?: string | null;
  type?: string | null;
}

function summarize(samples: Sample[]) {
  const values = samples.map((s) => s.value).filter((v) => typeof v === "number");
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Number((sum / values.length).toFixed(3)),
    first_timestamp: samples[0]?.timestamp,
    last_timestamp: samples[samples.length - 1]?.timestamp,
  };
}

function downsample(samples: Sample[], max: number): Sample[] {
  if (samples.length <= max) return samples;
  const step = samples.length / max;
  const out: Sample[] = [];
  for (let i = 0; i < max; i++) out.push(samples[Math.floor(i * step)]);
  return out;
}

export function registerGetWearableTimeseries(server: McpServer, client: JunctionClient) {
  server.registerTool(
    "get_wearable_timeseries",
    {
      title: "Get Wearable Timeseries Data",
      description:
        "Fetch raw timestamped samples for one wearable metric over a date range (max 31 days). " +
        "Discrete (point-in-time) resources — Cardiorespiratory: respiratory_rate. " +
        "Vitals: blood_oxygen (SpO2 %), blood_pressure, glucose (CGM, mmol/L), heartrate (bpm), hrv (rmssd), " +
        "electrocardiogram_voltage. Wellness: stress_level. Body: body_fat, body_weight. " +
        "Interval (start/end window) resources — Activity: calories_active, calories_basal, distance, " +
        "floors_climbed, steps, workout_duration, fall, wheelchair_push, stand_duration, stand_hour. " +
        "Body: body_temperature, body_temperature_delta, insulin_injection, waist_circumference, " +
        "body_mass_index, lean_body_mass, basal_body_temperature. " +
        "Vitals: afib_burden, heart_rate_alert, forced_expiratory_volume_1, forced_vital_capacity, " +
        "peak_expiratory_flow_rate, inhaler_usage, heart_rate_recovery_one_minute. " +
        "Cardiorespiratory: vo2_max. Nutrition: carbohydrates, caffeine, water. " +
        "Wellness: mindfulness_minutes, sleep_apnea_alert, sleep_breathing_disturbance, uv_exposure, " +
        "daylight_exposure, handwashing. Workout Stream: workout_distance, workout_swimming_stroke. Diary: note. " +
        "Very-high-frequency resources (heartrate, calories_active) and high-frequency ones (steps, glucose, " +
        "stress_level, respiratory_rate) can return thousands of samples/day, so responses include summary " +
        "stats (min/max/avg) and are evenly downsampled to at most 400 points — narrow the date range for full resolution. " +
        "Sparse resources (alert-type data especially) may return few or no samples in a given window. " +
        "Prefer get_wearable_summary for daily/session aggregates; use this for intraday patterns and trends.",
      inputSchema: {
        user_id: userIdSchema,
        resource: z.enum(TIMESERIES_RESOURCES).describe("Which timeseries metric to fetch."),
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
        const raw = (await client.getTimeseries(user_id, resource, start_date, end)) as Sample[];
        if (!Array.isArray(raw)) return jsonResult(raw);

        const samples = downsample(raw, MAX_SAMPLES).map((s) => ({
          timestamp: s.timestamp,
          value: s.value,
          ...(s.type ? { type: s.type } : {}),
        }));

        return jsonResult({
          resource,
          user_id,
          start_date,
          end_date: end,
          unit: raw[0]?.unit ?? null,
          total_samples: raw.length,
          returned_samples: samples.length,
          downsampled: raw.length > samples.length,
          stats: summarize(raw),
          samples,
        });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}
