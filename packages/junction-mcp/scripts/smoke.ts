/**
 * Phase 1 smoke test: verify the typed Junction client returns real data
 * from the seeded sandbox. Run with: npm run smoke
 */
import { readFileSync } from "node:fs";
import { JunctionClient, JunctionApiError } from "../lib/junction/client";

// Load .env.local manually (no dotenv dependency needed for a script).
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // rely on ambient env
}

const apiKey = process.env.JUNCTION_API_KEY;
if (!apiKey) {
  console.error("Missing JUNCTION_API_KEY");
  process.exit(1);
}

const state = JSON.parse(
  readFileSync("junction-sandbox-setup/sandbox_state.json", "utf8"),
);

const client = new JunctionClient({ apiKey });

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
}

async function step(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    const json = JSON.stringify(result);
    console.log(`✓ ${name} — ${json.length} bytes: ${json.slice(0, 220)}…`);
    return result;
  } catch (err) {
    if (err instanceof JunctionApiError) {
      console.log(`✗ ${name} — ${err.status}: ${JSON.stringify(err.body).slice(0, 300)}`);
    } else {
      console.log(`✗ ${name} — ${err}`);
    }
    return undefined;
  }
}

async function main() {
  const multiUser = state.users.mcp_device_multi.userId;
  const cgmUser = state.users.mcp_device_freestyle.userId;
  const abnormalOrder = state.orders.completed_testkit_abnormal.orderId;

  await step("listUsers", () => client.listUsers());
  await step("getUserConnections(multi)", () => client.getUserConnections(multiUser));
  await step("sleep summary (multi, 7d)", () =>
    client.getSummary("sleep", multiUser, daysAgo(7), daysAgo(0)),
  );
  await step("activity summary (multi, 7d)", () =>
    client.getSummary("activity", multiUser, daysAgo(7), daysAgo(0)),
  );
  await step("hrv timeseries (multi, 3d)", () =>
    client.getTimeseries(multiUser, "hrv", daysAgo(3), daysAgo(0)),
  );
  await step("glucose timeseries (cgm, 1d)", () =>
    client.getTimeseries(cgmUser, "glucose", daysAgo(1), daysAgo(0)),
  );
  await step("listLabTests", () => client.listLabTests());
  await step("listOrders", () => client.listOrders({ size: 5 }));
  await step("getOrder(abnormal)", () => client.getOrder(abnormalOrder));
  await step("getOrderResults(abnormal)", () => client.getOrderResults(abnormalOrder));
}

main();
