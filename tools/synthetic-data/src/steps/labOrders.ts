import type { Junction, JunctionClient } from "@junction-api/sdk";
import { v5 as uuidv5 } from "uuid";
import {
  IDEMPOTENCY_NAMESPACE,
  SCHEDULED_ORDER_ACTIVATE_IN_DAYS,
  dateDaysFromNow,
  describeError,
} from "../config.js";
import { getUserSpec } from "./users.js";
import type { LabMethod, OrderRecord, ScenarioResult, UserRecord } from "../types.js";

type ScenarioKind = "completed" | "frozen" | "cancelled" | "unregistered" | "scheduled";

interface ScenarioDef {
  key: string;
  kind: ScenarioKind;
  user: string; // clientUserId
  method: LabMethod;
  finalStatus?: Junction.OrderStatus;
  flags?: Junction.SimulationFlags;
  /** Book a phlebotomy appointment after creation — required before simulation can progress. */
  bookAppointment?: boolean;
  /** Bump to abandon an order burned into a wrong terminal state under the previous idempotency key. */
  rev?: number;
}

const SCENARIOS: ScenarioDef[] = [
  // Group A — completed, one per modality
  { key: "completed_testkit_normal", kind: "completed", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "completed.testkit.completed", flags: { interpretation: "normal", resultTypes: ["numeric"] } },
  { key: "completed_walkin_normal", kind: "completed", user: "mcp_lab_standard", method: "walk_in_test",
    finalStatus: "completed.walk_in_test.completed", flags: { interpretation: "normal", resultTypes: ["numeric"] } },
  { key: "completed_phlebotomy_normal", kind: "completed", user: "mcp_lab_phlebotomy_az", method: "at_home_phlebotomy",
    finalStatus: "completed.at_home_phlebotomy.completed", flags: { interpretation: "normal", resultTypes: ["numeric"] },
    bookAppointment: true },

  // Group B — result interpretation variants
  { key: "completed_testkit_abnormal", kind: "completed", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "completed.testkit.completed", flags: { interpretation: "abnormal" } },
  { key: "completed_testkit_critical", kind: "completed", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "completed.testkit.completed", flags: { interpretation: "critical" } },
  { key: "completed_testkit_missing", kind: "completed", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "completed.testkit.completed", flags: { interpretation: "normal", hasMissingResults: true } },

  // Group C — mixed result types
  { key: "completed_walkin_mixed_types", kind: "completed", user: "mcp_lab_standard", method: "walk_in_test",
    finalStatus: "completed.walk_in_test.completed",
    flags: { interpretation: "normal", resultTypes: ["numeric", "comment", "range"] } },

  // Group D — mid-lifecycle frozen orders
  { key: "frozen_testkit_transit", kind: "frozen", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "collecting_sample.testkit.transit_customer" },
  { key: "frozen_testkit_lab", kind: "frozen", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "sample_with_lab.testkit.delivered_to_lab" },
  // appointment_scheduled is unreachable here: PSC appointment booking supports quest/sonora_quest
  // only and this team's walk-in test is on labcorp, so freeze at requisition_created instead.
  { key: "frozen_walkin_requisition", kind: "frozen", user: "mcp_lab_walkin_quest", method: "walk_in_test",
    finalStatus: "received.walk_in_test.requisition_created" },
  { key: "frozen_testkit_failed", kind: "frozen", user: "mcp_lab_standard", method: "testkit",
    finalStatus: "failed.testkit.sample_error" },
  // Simulating to cancelled.* overshoots to completed in the sandbox FSM; cancel explicitly instead.
  { key: "frozen_testkit_cancelled", kind: "cancelled", user: "mcp_lab_standard", method: "testkit", rev: 2 },

  // Group E — registrable testkit, left unregistered
  { key: "registrable_testkit_pending", kind: "unregistered", user: "mcp_lab_standard", method: "testkit" },

  // Group F — scheduled future order
  { key: "scheduled_testkit_future", kind: "scheduled", user: "mcp_lab_standard", method: "testkit" },

  // No redraw scenario: order transactions (redraws) are gated per team and not
  // enabled on standard sandbox teams ("This feature is not available to your team").
];

export const SCENARIO_COUNT = SCENARIOS.length;
export const SCENARIO_KEYS = SCENARIOS.map((s) => s.key);

interface LabPrereqs {
  labTests: Partial<Record<LabMethod, string>>;
}

export async function fetchLabPrerequisites(client: JunctionClient): Promise<LabPrereqs> {
  const tests = await client.labTests.get({ status: "active" });
  // One test per collection method, preferring manually created over auto-generated.
  const methods: readonly LabMethod[] = ["testkit", "walk_in_test", "at_home_phlebotomy"];
  const chosen: Partial<Record<LabMethod, Junction.ClientFacingLabTest>> = {};
  for (const test of tests) {
    if (test.status !== "active") continue;
    const method = test.method as LabMethod;
    if (!methods.includes(method)) continue;
    const current = chosen[method];
    if (!current || (current.autoGenerated && !test.autoGenerated)) chosen[method] = test;
  }
  const labTests: Partial<Record<LabMethod, string>> = {};
  for (const [method, test] of Object.entries(chosen)) {
    labTests[method as LabMethod] = test.id;
  }
  if (Object.keys(labTests).length === 0) {
    throw new Error("No active lab tests found on this sandbox team — cannot create lab orders.");
  }

  return { labTests };
}

function idempotencyKey(def: ScenarioDef): string {
  const seed = def.rev ? `${def.key}#${def.rev}` : def.key;
  return uuidv5(seed, IDEMPOTENCY_NAMESPACE);
}

function orderRequestFor(
  def: ScenarioDef,
  user: UserRecord,
  prereqs: LabPrereqs,
): Junction.CreateOrderRequestCompatible {
  const d = getUserSpec(def.user).demographics;
  return {
    idempotencyKey: idempotencyKey(def),
    userId: user.userId,
    labTestId: prereqs.labTests[def.method]!,
    patientDetails: {
      firstName: d.firstName,
      lastName: d.lastName,
      dob: d.dob,
      gender: d.gender,
      phoneNumber: d.phoneNumber,
      email: d.email,
    },
    patientAddress: {
      receiverName: `${d.firstName} ${d.lastName}`,
      firstLine: d.address.firstLine,
      city: d.address.city,
      state: d.address.state,
      zip: d.address.zipCode,
      country: "US",
      phoneNumber: d.phoneNumber,
    },
  };
}

/**
 * At-home phlebotomy orders cannot progress through simulation until an
 * appointment exists; book the first available sandbox slot at the patient's
 * address. No-op when the order has already left the received stage.
 */
async function ensurePhlebotomyAppointment(
  client: JunctionClient,
  def: ScenarioDef,
  orderId: string,
): Promise<boolean> {
  const fresh = await client.labTests.getOrder({ orderId });
  const stage = (fresh.lastEvent?.status as string | undefined)?.split(".")[0];
  if (stage !== "received") return false;

  const d = getUserSpec(def.user).demographics;
  const avail = await client.labTests.getPhlebotomyAppointmentAvailability({
    body: {
      firstLine: d.address.firstLine,
      city: d.address.city,
      state: d.address.state,
      zipCode: d.address.zipCode,
    },
  });
  const slot = avail.slots.find((day) => day.slots.length > 0)?.slots[0];
  if (!slot?.bookingKey) {
    throw new Error(`no phlebotomy appointment slots available near ${d.address.zipCode}`);
  }
  await client.labTests.bookPhlebotomyAppointment({ orderId, body: { bookingKey: slot.bookingKey } });
  return true;
}

// The sandbox FSM rejects (500) simulation requests for orders in these stages.
const UNSIMULATABLE_STAGES = new Set(["sample_with_lab", "completed", "failed", "cancelled"]);

/**
 * Simulate toward finalStatus. Simulation progresses asynchronously server-side,
 * and re-runs replay the same order via its idempotency key, so fetch the
 * authoritative status first: skip when already at target, and never re-simulate
 * orders in stages the FSM rejects — record their actual status instead.
 */
async function simulateTo(
  client: JunctionClient,
  orderId: string,
  finalStatus: Junction.OrderStatus | undefined,
  flags: Junction.SimulationFlags | undefined,
): Promise<{ detail: string; status: string }> {
  const fresh = await client.labTests.getOrder({ orderId });
  const current = fresh.lastEvent?.status as string | undefined;
  if (finalStatus && current === finalStatus) {
    return { detail: `already at ${finalStatus}, simulation skipped`, status: finalStatus };
  }
  const stage = current?.split(".")[0] ?? "";
  if (current && UNSIMULATABLE_STAGES.has(stage)) {
    const note = finalStatus && current !== finalStatus ? ` — wanted ${finalStatus}, cannot re-simulate` : "";
    return { detail: `already at ${current}${note}`, status: current };
  }
  await client.labTests.simulateOrderProcess({
    orderId,
    delay: 1,
    ...(finalStatus ? { finalStatus } : {}),
    ...(flags && Object.keys(flags).length > 0 ? { body: flags } : {}),
  });
  return finalStatus
    ? { detail: `simulated to ${finalStatus}`, status: finalStatus }
    : { detail: "simulated to completed", status: "completed" };
}

interface StepOutput {
  orders: Record<string, OrderRecord>;
  results: ScenarioResult[];
}

export async function runLabOrdersStep(
  client: JunctionClient,
  users: Record<string, UserRecord>,
  opts: { dryRun: boolean; priorOrders?: Record<string, OrderRecord> },
): Promise<{ prereqs: LabPrereqs | null } & StepOutput> {
  const orders: Record<string, OrderRecord> = {};
  const results: ScenarioResult[] = [];

  if (opts.dryRun) {
    for (const def of SCENARIOS) {
      const target =
        def.finalStatus ??
        (def.kind === "scheduled"
          ? "received (activates in 14 days)"
          : def.kind === "cancelled"
            ? `cancelled.${def.method}.cancelled (via cancel endpoint)`
            : "received.testkit.awaiting_registration");
      console.log(`  ~ ${def.key} → would create ${def.method} order for ${def.user}, target: ${target}`);
    }
    return { prereqs: null, orders, results };
  }

  let prereqs: LabPrereqs;
  try {
    prereqs = await fetchLabPrerequisites(client);
  } catch (err) {
    console.log(`  ✗ PREREQUISITES FAILED: ${describeError(err)}`);
    console.log("  Aborting lab orders step — no lab test catalog available.");
    return { prereqs: null, orders, results };
  }

  for (const def of SCENARIOS) {
    const user = users[def.user];
    if (!user) {
      results.push({ key: def.key, outcome: "failed", detail: `user ${def.user} not resolved (run users step first)` });
      console.log(`  ✗ ${def.key} → FAILED: user ${def.user} not resolved`);
      continue;
    }
    const labTestId = prereqs.labTests[def.method];
    if (!labTestId) {
      results.push({ key: def.key, outcome: "failed", detail: `no active ${def.method} lab test found` });
      console.log(`  ✗ ${def.key} → FAILED: no active ${def.method} lab test found`);
      continue;
    }

    try {
      switch (def.kind) {
        case "completed":
        case "frozen": {
          const { order } = await client.labTests.createOrder(orderRequestFor(def, user, prereqs));
          const booked = def.bookAppointment && (await ensurePhlebotomyAppointment(client, def, order.id));
          const result = await simulateTo(client, order.id, def.finalStatus, def.flags);
          const detail = booked ? `appointment booked, ${result.detail}` : result.detail;
          const { status } = result;
          orders[def.key] = {
            orderId: order.id,
            orderTransactionId: order.orderTransaction?.id,
            method: def.method,
            interpretation: def.flags?.interpretation,
            status,
          };
          results.push({ key: def.key, outcome: "ok", detail });
          console.log(`  + ${def.key} → order ${order.id} (${detail})`);
          break;
        }

        case "cancelled": {
          const { order } = await client.labTests.createOrder(orderRequestFor(def, user, prereqs));
          const fresh = await client.labTests.getOrder({ orderId: order.id });
          const current = fresh.lastEvent?.status as string | undefined;
          let detail: string;
          if (current?.startsWith("cancelled.")) {
            detail = "already cancelled, skipped";
          } else {
            await client.labTests.cancelOrder({ orderId: order.id });
            detail = "cancelled via cancel endpoint";
          }
          orders[def.key] = {
            orderId: order.id,
            orderTransactionId: order.orderTransaction?.id,
            method: def.method,
            status: `cancelled.${def.method}.cancelled`,
          };
          results.push({ key: def.key, outcome: "ok", detail });
          console.log(`  + ${def.key} → order ${order.id} (${detail})`);
          break;
        }

        case "scheduled": {
          const activateBy = dateDaysFromNow(SCHEDULED_ORDER_ACTIVATE_IN_DAYS);
          const { order } = await client.labTests.createOrder({
            ...orderRequestFor(def, user, prereqs),
            activateBy,
          });
          orders[def.key] = {
            orderId: order.id,
            orderTransactionId: order.orderTransaction?.id,
            method: def.method,
            status: (order.lastEvent?.status as string | undefined) ?? "scheduled",
          };
          results.push({ key: def.key, outcome: "ok", detail: `scheduled, activates ${activateBy}` });
          console.log(`  + ${def.key} → order ${order.id} (scheduled, activates ${activateBy})`);
          break;
        }

        case "unregistered": {
          // The unregistered-testkit endpoint has no idempotency key; reuse the
          // prior order from state if it is still awaiting registration.
          const prior = opts.priorOrders?.[def.key];
          if (prior) {
            const existing = await client.labTests.getOrder({ orderId: prior.orderId }).catch(() => null);
            if (existing?.lastEvent?.status === "received.testkit.awaiting_registration") {
              orders[def.key] = prior;
              results.push({ key: def.key, outcome: "ok", detail: "existing order still awaiting registration" });
              console.log(`  ✓ ${def.key} → order ${prior.orderId} (existing, still awaiting registration)`);
              break;
            }
          }
          const d = getUserSpec(def.user).demographics;
          const { order } = await client.testkit.createOrder({
            userId: user.userId,
            labTestId,
            shippingDetails: {
              receiverName: `${d.firstName} ${d.lastName}`,
              firstLine: d.address.firstLine,
              city: d.address.city,
              state: d.address.state,
              zip: d.address.zipCode,
              country: "US",
              phoneNumber: d.phoneNumber,
            },
          });
          orders[def.key] = {
            orderId: order.id,
            orderTransactionId: order.orderTransaction?.id,
            method: def.method,
            status: (order.lastEvent?.status as string | undefined) ?? "received.testkit.awaiting_registration",
          };
          results.push({ key: def.key, outcome: "ok", detail: "awaiting registration" });
          console.log(`  + ${def.key} → order ${order.id} (awaiting registration, not registered on purpose)`);
          break;
        }

      }
    } catch (err) {
      const detail = describeError(err);
      results.push({ key: def.key, outcome: "failed", detail });
      console.log(`  ✗ ${def.key} → FAILED: ${detail}`);
    }
  }

  return { prereqs, orders, results };
}
