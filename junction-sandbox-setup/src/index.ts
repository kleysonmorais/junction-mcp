import { JunctionClient, JunctionEnvironment } from "@junction-api/sdk";
import { DEMO_CONNECTION_EXPIRY_DAYS, isoDaysFromNow, requireApiKey } from "./config.js";
import { runUsersStep } from "./steps/users.js";
import { runDevicesStep } from "./steps/devices.js";
import { runLabOrdersStep, SCENARIO_COUNT } from "./steps/labOrders.js";
import { readState, writeState } from "./steps/state.js";
import type { SandboxState, ScenarioResult } from "./types.js";

type Step = "users" | "devices" | "lab";

interface CliFlags {
  resetDevices: boolean;
  only: Step | null;
  dryRun: boolean;
}

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = { resetDevices: false, only: null, dryRun: false };
  for (const arg of argv) {
    if (arg === "--reset-devices") flags.resetDevices = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg.startsWith("--only=")) {
      const step = arg.slice("--only=".length);
      if (step !== "users" && step !== "devices" && step !== "lab") {
        console.error(`Invalid --only value "${step}". Expected: users | devices | lab`);
        process.exit(1);
      }
      flags.only = step;
    } else {
      console.error(`Unknown flag: ${arg}`);
      console.error("Usage: npx ts-node src/index.ts [--reset-devices] [--only=users|devices|lab] [--dry-run]");
      process.exit(1);
    }
  }
  return flags;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  const shouldRun = (step: Step): boolean => flags.only === null || flags.only === step;

  const client = new JunctionClient({
    apiKey: requireApiKey(),
    environment: JunctionEnvironment.Sandbox,
  });

  const prior = await readState();
  let users = prior?.users ?? {};

  // [1/4] Users
  console.log("\n[1/4] Users");
  if (shouldRun("users")) {
    const resolved = await runUsersStep(client, { dryRun: flags.dryRun });
    if (!flags.dryRun) users = { ...users, ...resolved };
  } else {
    console.log("  - skipped (--only)");
  }

  if (!flags.dryRun && flags.only !== "users" && Object.keys(users).length === 0) {
    console.error("\nNo users available. Run without --only, or run --only=users first.");
    process.exit(1);
  }

  // [2/4] Devices
  console.log("\n[2/4] Devices");
  let deviceConnections = prior?.deviceConnections ?? {};
  if (shouldRun("devices")) {
    const connections = await runDevicesStep(client, users, {
      reset: flags.resetDevices,
      dryRun: flags.dryRun,
    });
    if (!flags.dryRun) deviceConnections = { ...deviceConnections, ...connections };
  } else {
    console.log("  - skipped (--only)");
  }

  // [3/4] Lab Orders
  console.log("\n[3/4] Lab Orders");
  let orders = prior?.orders ?? {};
  let labAccountId = prior?.labAccountId ?? "";
  let labTests = prior?.labTests ?? {};
  let labResults: ScenarioResult[] = [];
  if (shouldRun("lab")) {
    const out = await runLabOrdersStep(client, users, { dryRun: flags.dryRun });
    labResults = out.results;
    if (!flags.dryRun && out.prereqs) {
      labAccountId = out.prereqs.labAccountId;
      labTests = { ...labTests, ...out.prereqs.labTests };
      orders = { ...orders, ...out.orders };
    }
  } else {
    console.log("  - skipped (--only)");
  }

  // [4/4] State
  console.log("\n[4/4] State");
  if (flags.dryRun) {
    console.log("  ~ dry run: sandbox_state.json not written");
  } else {
    const state: SandboxState = {
      generated_at: new Date().toISOString(),
      expires_at: isoDaysFromNow(DEMO_CONNECTION_EXPIRY_DAYS),
      users,
      labAccountId,
      labTests,
      orders,
      deviceConnections,
    };
    await writeState(state);
    console.log(`  ✓ sandbox_state.json written (expires ${state.expires_at})`);
  }

  // Summary
  if (labResults.length > 0) {
    const succeeded = labResults.filter((r) => r.outcome === "ok").length;
    const failed = labResults.filter((r) => r.outcome === "failed");
    console.log(`\nDone: ${succeeded}/${SCENARIO_COUNT} scenarios succeeded, ${failed.length} failed${failed.length > 0 ? " (see above)" : ""}`);
    if (failed.length > 0) {
      console.log("\nFailures:");
      for (const f of failed) console.log(`  ✗ ${f.key}: ${f.detail}`);
      process.exitCode = 1;
    }
  } else {
    console.log("\nDone.");
  }
}

main().catch((err) => {
  console.error("\nFatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
