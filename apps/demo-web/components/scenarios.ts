/**
 * Demo scenarios — chosen from what the seeded sandbox actually supports
 * (see tools/synthetic-data/): device users with fitbit/oura/freestyle_libre
 * demo connections and 13+ lab orders across normal/abnormal/critical states.
 */
export interface Scenario {
  /** Prompt shown to the user and sent to the agent. */
  label: string;
  /** Mono sub-label hinting at the tools the agent will reach for. */
  sub: string;
  /** The message actually sent to the agent. */
  prompt: string;
}

export const SCENARIOS: Scenario[] = [
  {
    label: "Review the completed lab orders and flag anything abnormal.",
    sub: "→ search_lab_results · get_lab_results",
    prompt:
      "Review the completed lab orders and flag any abnormal or critical results. For each out-of-range marker, tell me the value, the reference range, and what it might mean.",
  },
  {
    label: "Find Maria's lab results and which tests measure glucose.",
    sub: "→ search_users · search_lab_results · search_lab_markers",
    prompt:
      "Look up the patient named Maria, summarize her most recent lab results (highlighting anything out of range), and tell me which lab tests in the catalog measure glucose.",
  },
  {
    label: "How did glucose trend for the FreeStyle demo user last week?",
    sub: "→ get_wearable_timeseries · glucose",
    prompt:
      "Analyze the last 2 days of glucose readings for the CGM user 'mcp_device_freestyle'. Were there any spikes or dips, and how much time was spent outside a healthy range?",
  },
  {
    label: "Compare sleep across the demo users this month.",
    sub: "→ get_wearable_summary · sleep",
    prompt:
      "How has the user 'mcp_device_multi' been sleeping over the last week? Compare their sleep quality with their HRV trend and tell me whether they look recovered or strained.",
  },
];
