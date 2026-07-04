/**
 * Scenarios — chosen from what the seeded sandbox actually supports
 * (see tools/synthetic-data/): device users with fitbit/oura/freestyle_libre
 * connections and 13+ lab orders across normal/abnormal/critical states.
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
    label: "Track which lab orders are still in flight and what's blocking them.",
    sub: "→ list_lab_orders · get_lab_order",
    prompt:
      "List all lab orders that are NOT yet completed and group them by lifecycle stage. For any order that failed, was cancelled, or is stuck awaiting registration, pull its full status history and tell me exactly what happened and what the next action should be.",
  },
  {
    label: "Find Maria's lab results and which tests measure glucose.",
    sub: "→ search_users · search_lab_results · search_lab_markers",
    prompt:
      "Look up the patient named Maria, summarize her most recent lab results (highlighting anything out of range), and tell me which lab tests in the catalog measure glucose.",
  },
  {
    label: "Build a full health snapshot for the multi-device user.",
    sub: "→ search_users · get_user_connections · get_wearable_summary · search_lab_results",
    prompt:
      "Put together a complete health snapshot for 'mcp_device_multi': confirm their connected devices, summarize the last week of activity and sleep from their wearables, and pull any lab results on file. Then give me an overall read on how this person is doing.",
  },
  {
    label: "Which lab tests can I order, and how do collection methods compare?",
    sub: "→ list_lab_tests · search_lab_tests",
    prompt:
      "Show me the orderable lab test catalog. Break the tests down by collection method (testkit, walk-in, at-home phlebotomy), and for each method tell me the sample type, price, and which markers are included so I can decide what to order.",
  },
  {
    label: "Which users have devices connected, and what data do they stream?",
    sub: "→ list_users · get_user_connections",
    prompt:
      "List every user on the sandbox team and, for each one with a wearable connected, tell me the provider (Fitbit, Oura, FreeStyle Libre), the connection status, and which data resources it supplies. Flag anyone whose connection isn't fully active.",
  },
  {
    label: "How did glucose trend for the FreeStyle CGM user last week?",
    sub: "→ get_wearable_timeseries · glucose",
    prompt:
      "Analyze the last 2 days of glucose readings for the CGM user 'mcp_device_freestyle'. Were there any spikes or dips, and how much time was spent outside a healthy range?",
  },
  {
    label: "Compare sleep and recovery for the multi-device user this week.",
    sub: "→ get_wearable_summary · sleep",
    prompt:
      "How has the user 'mcp_device_multi' been sleeping over the last week? Compare their sleep quality with their HRV trend and tell me whether they look recovered or strained.",
  },
];
