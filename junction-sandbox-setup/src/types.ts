import type { Junction } from "@junction-api/sdk";

export type LabMethod = "testkit" | "walk_in_test" | "at_home_phlebotomy";

export type DemoProvider = Junction.DemoProviders;

export interface Demographics {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string; // E.164
  gender: "male" | "female";
  dob: string; // YYYY-MM-DD
  address: {
    firstLine: string;
    zipCode: string;
    state: string;
    city: string;
  };
}

export interface UserSpec {
  clientUserId: string;
  purpose: string;
  demographics: Demographics;
}

export interface UserRecord {
  userId: string;
  clientUserId: string;
}

export interface OrderRecord {
  orderId: string;
  orderTransactionId?: string;
  method: LabMethod;
  interpretation?: string;
  status: string;
  redrawnOrderId?: string;
}

export interface SandboxState {
  generated_at: string;
  expires_at: string;
  users: Record<string, UserRecord>;
  labTests: Partial<Record<LabMethod, string>>;
  orders: Record<string, OrderRecord>;
  deviceConnections: Record<string, string[]>;
}

export type ScenarioOutcome = "ok" | "skipped" | "failed";

export interface ScenarioResult {
  key: string;
  outcome: ScenarioOutcome;
  detail: string;
}
