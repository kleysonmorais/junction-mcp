import type { JunctionClient } from "@junction-api/sdk";
import { describeError, isNotFound } from "../config.js";
import type { UserRecord, UserSpec } from "../types.js";

// Names must satisfy the lab-partner validation regex:
// ^([a-zA-Z0-9]{1})([a-zA-Z0-9-.,']*(\s[a-zA-Z0-9-.,']+)*[a-zA-Z0-9-.,']?)$
export const USER_SPECS: UserSpec[] = [
  {
    clientUserId: "mcp_lab_standard",
    purpose: "Standard lab orders, all modalities",
    demographics: {
      firstName: "James",
      lastName: "Holloway",
      email: "mcp.lab.standard@example.com",
      phoneNumber: "+14155550101",
      gender: "male",
      dob: "1985-03-14",
      address: { firstLine: "1200 Grand Ave", zipCode: "91789", state: "CA", city: "Walnut" },
    },
  },
  {
    clientUserId: "mcp_lab_phlebotomy_az",
    purpose: "At-home phlebotomy - Getlabs (85004 only)",
    demographics: {
      firstName: "Maria",
      lastName: "Delgado",
      email: "mcp.lab.phlebotomy.az@example.com",
      phoneNumber: "+16025550102",
      gender: "female",
      dob: "1978-11-02",
      address: { firstLine: "111 E Monroe St", zipCode: "85004", state: "AZ", city: "Phoenix" },
    },
  },
  {
    clientUserId: "mcp_lab_phlebotomy_wi",
    purpose: "At-home phlebotomy - PhlebFinders (54650 only)",
    demographics: {
      firstName: "Robert",
      lastName: "Kowalski",
      email: "mcp.lab.phlebotomy.wi@example.com",
      phoneNumber: "+16085550103",
      gender: "male",
      dob: "1969-07-23",
      address: { firstLine: "500 Main St", zipCode: "54650", state: "WI", city: "Onalaska" },
    },
  },
  {
    clientUserId: "mcp_lab_walkin_quest",
    purpose: "Walk-in + PSC appointment scheduling",
    demographics: {
      firstName: "Angela",
      lastName: "Whitfield",
      email: "mcp.lab.walkin.quest@example.com",
      phoneNumber: "+16025550104",
      gender: "female",
      dob: "1992-05-30",
      address: { firstLine: "24 W Adams St", zipCode: "85004", state: "AZ", city: "Phoenix" },
    },
  },
  {
    clientUserId: "mcp_device_fitbit",
    purpose: "Fitbit demo connection",
    demographics: {
      firstName: "Derek",
      lastName: "Nakamura",
      email: "mcp.device.fitbit@example.com",
      phoneNumber: "+14155550105",
      gender: "male",
      dob: "1990-09-18",
      address: { firstLine: "415 Mission St", zipCode: "94105", state: "CA", city: "San Francisco" },
    },
  },
  {
    clientUserId: "mcp_device_oura",
    purpose: "Oura demo connection",
    demographics: {
      firstName: "Priya",
      lastName: "Raman",
      email: "mcp.device.oura@example.com",
      phoneNumber: "+14155550106",
      gender: "female",
      dob: "1988-01-25",
      address: { firstLine: "535 Mission St", zipCode: "94105", state: "CA", city: "San Francisco" },
    },
  },
  {
    clientUserId: "mcp_device_freestyle",
    purpose: "Freestyle Libre demo (glucose timeseries)",
    demographics: {
      firstName: "Samuel",
      lastName: "Osei",
      email: "mcp.device.freestyle@example.com",
      phoneNumber: "+14155550107",
      gender: "male",
      dob: "1975-12-08",
      address: { firstLine: "101 Spear St", zipCode: "94105", state: "CA", city: "San Francisco" },
    },
  },
  {
    clientUserId: "mcp_device_multi",
    purpose: "Multi-provider: Fitbit + Oura same user",
    demographics: {
      firstName: "Lauren",
      lastName: "O'Brien",
      email: "mcp.device.multi@example.com",
      phoneNumber: "+14155550108",
      gender: "female",
      dob: "1996-04-11",
      address: { firstLine: "160 Spear St", zipCode: "94105", state: "CA", city: "San Francisco" },
    },
  },
];

export function getUserSpec(clientUserId: string): UserSpec {
  const spec = USER_SPECS.find((u) => u.clientUserId === clientUserId);
  if (!spec) throw new Error(`Unknown user spec: ${clientUserId}`);
  return spec;
}

export async function runUsersStep(
  client: JunctionClient,
  opts: { dryRun: boolean },
): Promise<Record<string, UserRecord>> {
  const users: Record<string, UserRecord> = {};

  for (const spec of USER_SPECS) {
    if (opts.dryRun) {
      console.log(`  ~ ${spec.clientUserId} (would resolve-or-create, then upsert demographics)`);
      continue;
    }

    try {
      let userId: string;
      try {
        const existing = await client.user.getByClientUserId({ clientUserId: spec.clientUserId });
        userId = existing.userId;
        console.log(`  ✓ ${spec.clientUserId} (existing: ${userId})`);
      } catch (err) {
        if (!isNotFound(err)) throw err;
        const created = await client.user.create({ clientUserId: spec.clientUserId });
        userId = created.userId;
        console.log(`  + ${spec.clientUserId} (created: ${userId})`);
      }

      const d = spec.demographics;
      await client.user.upsertUserInfo({
        userId,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phoneNumber: d.phoneNumber,
        gender: d.gender,
        dob: d.dob,
        address: {
          firstLine: d.address.firstLine,
          city: d.address.city,
          state: d.address.state,
          zip: d.address.zipCode,
          country: "US",
        },
      });

      users[spec.clientUserId] = { userId, clientUserId: spec.clientUserId };
    } catch (err) {
      console.log(`  ✗ ${spec.clientUserId} → FAILED: ${describeError(err)}`);
    }
  }

  return users;
}
