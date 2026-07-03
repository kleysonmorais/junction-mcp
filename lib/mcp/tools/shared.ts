import { z } from "zod";
import { JunctionApiError } from "../../junction/client";

/** Shape of an MCP tool result (subset of the SDK's CallToolResult). */
export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export const userIdSchema = z
  .string()
  .uuid()
  .describe("Junction user_id (UUID). Discover users with the list_users tool.");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

/** Widest date window a single wearable-data call may span. */
export const MAX_RANGE_DAYS = 31;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns a human-readable problem with the requested window, or null if OK.
 * Junction forwards provider data unsampled, so wide windows on dense
 * resources produce payloads no LLM context window should ingest.
 */
export function checkDateRange(startDate: string, endDate: string): string | null {
  const start = Date.parse(startDate);
  const end = Date.parse(endDate);
  if (Number.isNaN(start) || Number.isNaN(end)) return "Invalid date.";
  if (end < start) return "end_date must be on or after start_date.";
  const days = (end - start) / 86400_000;
  if (days > MAX_RANGE_DAYS) {
    return `Date range too wide (${Math.round(days)} days). Request at most ${MAX_RANGE_DAYS} days per call.`;
  }
  return null;
}

export function jsonResult(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 1) }] };
}

export function textError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Map any thrown error to an agent-friendly tool error (never a protocol error). */
export function errorResult(err: unknown): ToolResult {
  if (err instanceof JunctionApiError) {
    const hint =
      err.status === 401 || err.status === 403
        ? " The Junction API key was rejected — check that a valid sandbox key (sk_us_*/sk_eu_*) is configured."
        : err.status === 404
          ? " The resource was not found — verify the ID (use list_users / list_lab_orders to discover valid IDs)."
          : err.status === 429
            ? " Junction rate limit hit — wait a moment and retry."
            : "";
    return textError(`Junction API error ${err.status} on ${err.path}.${hint} Details: ${JSON.stringify(err.body).slice(0, 400)}`);
  }
  return textError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
}
