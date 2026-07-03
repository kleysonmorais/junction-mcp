import "dotenv/config";
import { JunctionError } from "@junction-api/sdk";

/** Fixed namespace for deterministic UUID v5 idempotency keys. */
export const IDEMPOTENCY_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/** Demo device connections expire after 7 days in the Junction sandbox. */
export const DEMO_CONNECTION_EXPIRY_DAYS = 7;

/** Scheduled order (Group F) activates this many days from now. */
export const SCHEDULED_ORDER_ACTIVATE_IN_DAYS = 14;

export const STATE_FILE = "sandbox_state.json";

export function requireApiKey(): string {
  const key = process.env.JUNCTION_SANDBOX_API_KEY;
  if (!key) {
    console.error("Missing JUNCTION_SANDBOX_API_KEY. Copy .env.example to .env and set your sandbox key.");
    process.exit(1);
  }
  return key;
}

export function isoDaysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

/** YYYY-MM-DD, `days` days from now (UTC). */
export function dateDaysFromNow(days: number): string {
  return isoDaysFromNow(days).slice(0, 10);
}

export function describeError(err: unknown): string {
  if (err instanceof JunctionError) {
    const body = err.body ? ` ${JSON.stringify(err.body).slice(0, 300)}` : "";
    return `${err.statusCode ?? "?"} ${err.message}${body}`;
  }
  return err instanceof Error ? err.message : String(err);
}

export function isNotFound(err: unknown): boolean {
  return err instanceof JunctionError && err.statusCode === 404;
}
