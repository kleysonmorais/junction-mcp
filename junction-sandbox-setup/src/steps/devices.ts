import type { JunctionClient } from "@junction-api/sdk";
import { describeError } from "../config.js";
import type { DemoProvider, UserRecord } from "../types.js";

export const DEVICE_PLAN: Record<string, DemoProvider[]> = {
  mcp_device_fitbit: ["fitbit"],
  mcp_device_oura: ["oura"],
  mcp_device_freestyle: ["freestyle_libre"],
  mcp_device_multi: ["fitbit", "oura"],
};

async function getConnectedSlugs(client: JunctionClient, userId: string): Promise<Set<string>> {
  const grouped = await client.user.getConnectedProviders({ userId });
  const connected = new Set<string>();
  for (const providers of Object.values(grouped)) {
    for (const p of providers) {
      if (p.status === "connected") connected.add(p.slug);
    }
  }
  return connected;
}

export async function runDevicesStep(
  client: JunctionClient,
  users: Record<string, UserRecord>,
  opts: { reset: boolean; dryRun: boolean },
): Promise<Record<string, string[]>> {
  const connections: Record<string, string[]> = {};

  for (const [clientUserId, providers] of Object.entries(DEVICE_PLAN)) {
    if (opts.dryRun) {
      const action = opts.reset ? "would deregister + re-create" : "would connect if missing";
      console.log(`  ~ ${providers.join(" + ")} → ${clientUserId} (${action})`);
      continue;
    }

    const user = users[clientUserId];
    if (!user) {
      console.log(`  ✗ ${clientUserId} → FAILED: user not found (run the users step first)`);
      continue;
    }

    const established: string[] = [];
    let createdAny = false;

    let connectedSlugs: Set<string>;
    try {
      connectedSlugs = await getConnectedSlugs(client, user.userId);
    } catch (err) {
      console.log(`  ✗ ${clientUserId} → FAILED to list providers: ${describeError(err)}`);
      continue;
    }

    for (const provider of providers) {
      try {
        if (connectedSlugs.has(provider)) {
          if (opts.reset) {
            await client.user.deregisterProvider({ userId: user.userId, provider });
            await client.link.connectDemoProvider({ userId: user.userId, provider });
            console.log(`  + ${provider} → ${clientUserId} (reset: deregistered + re-created)`);
            createdAny = true;
          } else {
            console.log(`  ✓ ${provider} → ${clientUserId} (already connected, skipped)`);
          }
        } else {
          await client.link.connectDemoProvider({ userId: user.userId, provider });
          console.log(`  + ${provider} → ${clientUserId} (created)`);
          createdAny = true;
        }
        established.push(provider);
      } catch (err) {
        console.log(`  ✗ ${provider} → ${clientUserId} FAILED: ${describeError(err)}`);
      }
    }

    if (createdAny) {
      try {
        await client.user.refresh({ userId: user.userId });
      } catch (err) {
        console.log(`  ! refresh ${clientUserId} failed (non-fatal): ${describeError(err)}`);
      }
    }

    if (established.length > 0) connections[clientUserId] = established;
  }

  return connections;
}
