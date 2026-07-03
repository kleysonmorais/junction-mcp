/**
 * Demo scenarios — chosen from what the seeded sandbox actually supports
 * (see tools/synthetic-data/): device users with fitbit/oura/freestyle_libre
 * demo connections and 13+ lab orders across normal/abnormal/critical states.
 */
export interface Scenario {
  title: string;
  tagline: string;
  prompt: string;
  emoji: string;
}

export const SCENARIOS: Scenario[] = [
  {
    emoji: "😴",
    title: "Recovery check-in",
    tagline: "Sleep + HRV, multi-signal reasoning across two wearables",
    prompt:
      "How has the user 'mcp_device_multi' been sleeping over the last week? Compare their sleep quality with their HRV trend and tell me whether they look recovered or strained.",
  },
  {
    emoji: "🩸",
    title: "CGM glucose review",
    tagline: "Intraday continuous glucose analysis",
    prompt:
      "Analyze the last 2 days of glucose readings for the CGM user 'mcp_device_freestyle'. Were there any spikes or dips, and how much time was spent outside a healthy range?",
  },
  {
    emoji: "🧪",
    title: "Lab results triage",
    tagline: "Flag abnormal & critical markers across completed orders",
    prompt:
      "Review the completed lab orders and flag any abnormal or critical results. For each out-of-range marker, tell me the value, the reference range, and what it might mean.",
  },
  {
    emoji: "📦",
    title: "Order tracking",
    tagline: "Lifecycle status across in-flight lab orders",
    prompt:
      "Which lab orders are still in progress (not completed, cancelled, or failed)? For each one, explain where it is in its lifecycle and what the next step is.",
  },
];
