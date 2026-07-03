# junction-sandbox-setup

Populates a Junction sandbox with users, demo device connections, and lab order
scenarios so an MCP server wrapping the Junction API (Core Platform + Devices +
Lab Testing) has diverse, realistic data to develop against.

## Setup

```bash
npm install
cp .env.example .env   # set JUNCTION_SANDBOX_API_KEY
```

## Usage

```bash
npm run setup                          # run all steps
npm run setup -- --dry-run             # print planned operations, no API calls
npm run setup -- --only=users          # users | devices | lab
npm run setup -- --reset-devices      # deregister + re-create demo connections (run weekly)
```

## What it creates

- **8 users** (`mcp_lab_*`, `mcp_device_*`) with demographics that satisfy
  lab-partner name validation, in zips chosen per modality (85004 for Getlabs
  at-home phlebotomy, 54650 for PhlebFinders, etc.)
- **5 demo device connections** across 4 users (fitbit, oura, freestyle_libre,
  and a multi-provider user). Demo connections expire after **7 days** — re-run
  with `--reset-devices` weekly.
- **16 lab order scenarios**: completed orders per modality (testkit, walk-in,
  at-home phlebotomy), abnormal/critical/missing-result variants, mixed result
  types, five mid-lifecycle frozen orders, an unregistered testkit, a
  future-scheduled order, and a redraw transaction (initial + child order).
  Orders use the team's active lab tests directly — no lab account needs to be
  provisioned on the sandbox team.

## Output

Writes `sandbox_state.json` (gitignored) mapping semantic scenario keys to real
UUIDs — user IDs, lab test IDs per method, order IDs, and device connections. The MCP server loads this file at startup.

Every step is idempotent: users are resolved by `client_user_id`, device
connections are skipped when already connected, and orders are created with
deterministic UUID v5 idempotency keys derived from the scenario key, so the
script is safe to re-run.
