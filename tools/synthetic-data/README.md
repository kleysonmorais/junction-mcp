# synthetic-data

Generates and manages the synthetic Junction sandbox data — users, demo device
connections, and lab order scenarios — so the `junction-mcp` server (Core
Platform + Devices + Lab Testing) has diverse, realistic data to develop
against.

This is the `synthetic-data` package in the pnpm workspace. Install once from
the repo root with `pnpm install`.

## Setup

```bash
cp .env.example .env   # set JUNCTION_SANDBOX_API_KEY
```

## Usage

The common case, from the repo root:

```bash
pnpm setup:sandbox   # run all steps
```

To pass flags, run inside this package (pnpm's `--filter` forwarding mangles
script flags):

```bash
cd tools/synthetic-data
pnpm setup -- --dry-run          # print planned operations, no API calls
pnpm setup -- --only=users       # users | devices | lab
pnpm setup -- --reset-devices    # deregister + re-create demo connections (run weekly)
```

## What it creates

- **8 users** (`mcp_lab_*`, `mcp_device_*`) with demographics that satisfy
  lab-partner name validation, in zips chosen per modality (85004 for Getlabs
  at-home phlebotomy, 54650 for PhlebFinders, etc.)
- **5 demo device connections** across 4 users (fitbit, oura, freestyle_libre,
  and a multi-provider user). Demo connections expire after **7 days** — re-run
  with `--reset-devices` weekly.
- **14 lab order scenarios**: completed orders per modality (testkit, walk-in,
  at-home phlebotomy), abnormal/critical/missing-result variants, mixed result
  types, mid-lifecycle frozen orders, a cancelled order, an unregistered
  testkit, and a future-scheduled order. Orders use the team's active lab tests
  directly — no lab account needs to be provisioned on the sandbox team.
  The at-home phlebotomy order books a real sandbox appointment first — the
  simulation FSM cannot progress appointment-based orders without one.
  On-site collection, redraw, and walk-in appointment scenarios are
  intentionally omitted: they require capabilities this team lacks (an on-site
  lab test, order transactions, and a Quest walk-in test — PSC appointment
  booking supports quest/sonora_quest only).

## Output

Writes `sandbox_state.json` (gitignored) mapping semantic scenario keys to real
UUIDs — user IDs, lab test IDs per method, order IDs, and device connections.
The core package's smoke test
([packages/junction-mcp/scripts/smoke.ts](../../packages/junction-mcp/scripts/smoke.ts))
reads it to exercise the client against known fixtures.

Every step is idempotent: users are resolved by `client_user_id`, device
connections are skipped when already connected, and orders are created with
deterministic UUID v5 idempotency keys derived from the scenario key, so the
script is safe to re-run.
