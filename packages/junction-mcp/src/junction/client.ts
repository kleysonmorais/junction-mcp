/**
 * Thin typed wrapper over the Junction sandbox REST API.
 *
 * Transport-agnostic: the same client backs the HTTP MCP endpoints, the stdio
 * entry point, and ad-hoc scripts. One instance per API key — keys are
 * per-request on /mcp, so construction must stay cheap (it is: no I/O).
 */

const DEFAULT_BASE_URL = "https://api.sandbox.us.junction.com";

/**
 * Wearable summary resources — one aggregated object per day or session.
 */
export const SUMMARY_RESOURCES = [
  "activity",
  "sleep",
  "sleep_cycle",
  "workouts",
  "body",
  "meal",
  "menstrual_cycle",
  "electrocardiogram",
] as const;
export type SummaryResource = (typeof SUMMARY_RESOURCES)[number];

/**
 * Timeseries resources — discrete or interval samples.
 * Verified against the sandbox's live OpenAPI spec (/openapi.json): docs/03-devices.md lists
 * `fat` and `weight`, but the real resource slugs are `body_fat` and `body_weight`.
 */
export const TIMESERIES_RESOURCES = [
  // Discrete — Cardiorespiratory
  "respiratory_rate",
  // Discrete — Vitals
  "blood_oxygen",
  "blood_pressure",
  "glucose",
  "heartrate",
  "hrv",
  "electrocardiogram_voltage",
  // Discrete — Wellness
  "stress_level",
  // Discrete — Body
  "body_fat",
  "body_weight",
  // Interval — Activity
  "calories_active",
  "calories_basal",
  "distance",
  "floors_climbed",
  "steps",
  "workout_duration",
  "fall",
  "wheelchair_push",
  "stand_duration",
  "stand_hour",
  // Interval — Body
  "body_temperature",
  "body_temperature_delta",
  "insulin_injection",
  "waist_circumference",
  "body_mass_index",
  "lean_body_mass",
  "basal_body_temperature",
  // Interval — Vitals
  "afib_burden",
  "heart_rate_alert",
  "forced_expiratory_volume_1",
  "forced_vital_capacity",
  "peak_expiratory_flow_rate",
  "inhaler_usage",
  "heart_rate_recovery_one_minute",
  // Interval — Cardiorespiratory
  "vo2_max",
  // Interval — Nutrition
  "carbohydrates",
  "caffeine",
  "water",
  // Interval — Wellness
  "mindfulness_minutes",
  "sleep_apnea_alert",
  "sleep_breathing_disturbance",
  "uv_exposure",
  "daylight_exposure",
  "handwashing",
  // Interval — Workout Stream
  "workout_distance",
  "workout_swimming_stroke",
  // Interval — Diary
  "note",
] as const;
export type TimeseriesResource = (typeof TIMESERIES_RESOURCES)[number];

export class JunctionApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly body: unknown,
  ) {
    super(
      `Junction API ${status} on ${path}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`.slice(0, 500),
    );
    this.name = "JunctionApiError";
  }
}

export interface JunctionClientOptions {
  apiKey: string;
  baseUrl?: string;
}

type Query = Record<string, string | number | boolean | undefined>;

export class JunctionClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(opts: JunctionClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  private async request<T>(path: string, query?: Query): Promise<T> {
    const url = new URL(this.baseUrl + path);
    for (const [k, v] of Object.entries(query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    let attempt = 0;
    for (;;) {
      const res = await fetch(url, {
        headers: {
          accept: "application/json",
          "x-vital-api-key": this.apiKey,
        },
      });

      // One retry on rate limit, honoring Retry-After (Junction documents
      // limits on e.g. the refresh endpoint).
      if (res.status === 429 && attempt === 0) {
        attempt++;
        const retryAfter = Number(res.headers.get("retry-after")) || 1;
        await new Promise((r) =>
          setTimeout(r, Math.min(retryAfter, 10) * 1000),
        );
        continue;
      }

      const text = await res.text();
      let body: unknown = text;
      try {
        body = JSON.parse(text);
      } catch {
        // non-JSON error body — keep raw text
      }

      if (!res.ok) throw new JunctionApiError(res.status, path, body);
      return body as T;
    }
  }

  // ── Core Platform ──────────────────────────────────────────────

  listUsers(): Promise<unknown> {
    return this.request("/v2/user/");
  }

  getUser(userId: string): Promise<unknown> {
    return this.request(`/v2/user/${encodeURIComponent(userId)}`);
  }

  resolveUser(clientUserId: string): Promise<unknown> {
    return this.request(`/v2/user/resolve/${encodeURIComponent(clientUserId)}`);
  }

  getUserConnections(userId: string): Promise<unknown> {
    return this.request(`/v2/user/providers/${encodeURIComponent(userId)}`);
  }

  // ── Devices (wearables) ────────────────────────────────────────

  getSummary(
    resource: SummaryResource,
    userId: string,
    startDate: string,
    endDate?: string,
  ): Promise<unknown> {
    return this.request(
      `/v2/summary/${resource}/${encodeURIComponent(userId)}`,
      { start_date: startDate, end_date: endDate },
    );
  }

  getProfile(userId: string): Promise<unknown> {
    return this.request(`/v2/summary/profile/${encodeURIComponent(userId)}`);
  }

  getTimeseries(
    userId: string,
    resource: TimeseriesResource,
    startDate: string,
    endDate?: string,
  ): Promise<unknown> {
    return this.request(
      `/v2/timeseries/${encodeURIComponent(userId)}/${resource}`,
      { start_date: startDate, end_date: endDate },
    );
  }

  // ── Lab Testing ────────────────────────────────────────────────

  listLabTests(): Promise<unknown> {
    return this.request("/v3/lab_tests/");
  }

  listOrders(query?: {
    user_id?: string;
    page?: number;
    size?: number;
  }): Promise<unknown> {
    return this.request("/v3/orders", query);
  }

  getOrder(orderId: string): Promise<unknown> {
    return this.request(`/v3/order/${encodeURIComponent(orderId)}`);
  }

  getOrderResults(orderId: string): Promise<unknown> {
    return this.request(`/v3/order/${encodeURIComponent(orderId)}/result`);
  }
}
