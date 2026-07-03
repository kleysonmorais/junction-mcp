/**
 * Thin typed wrapper over the Junction sandbox REST API.
 *
 * Transport-agnostic: the same client backs the HTTP MCP endpoints, the stdio
 * entry point, and ad-hoc scripts. One instance per API key — keys are
 * per-request on /mcp, so construction must stay cheap (it is: no I/O).
 */

const DEFAULT_BASE_URL = "https://api.sandbox.us.junction.com";

/** Wearable summary resources — one aggregated object per day or session. */
export const SUMMARY_RESOURCES = [
  "activity",
  "sleep",
  "workouts",
  "body",
] as const;
export type SummaryResource = (typeof SUMMARY_RESOURCES)[number];

/**
 * Timeseries resources exposed in v1 — the subset the sandbox demo providers
 * (fitbit, oura, freestyle_libre) actually populate, per docs/03-devices.md.
 */
export const TIMESERIES_RESOURCES = [
  "heartrate",
  "hrv",
  "glucose",
  "steps",
  "blood_oxygen",
  "respiratory_rate",
  "calories_active",
  "distance",
  "stress_level",
  "weight",
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
        await new Promise((r) => setTimeout(r, Math.min(retryAfter, 10) * 1000));
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
