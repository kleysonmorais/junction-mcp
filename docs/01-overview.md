# Junction API — Overview

> Source: https://docs.junction.com

## What Junction Is

Junction is a unified health data API that covers three pillars:

- **Core Platform** — user management, authentication, webhooks
- **Devices** — connect 300+ wearables and health devices, pull activity/sleep/vitals data
- **Lab Testing** — order lab tests, manage appointments, retrieve structured results

## Environments

| Environment | Base URL | API Key Prefix |
|---|---|---|
| 🇺🇸 Production US | `https://api.us.junction.com` | `pk_us_*` |
| 🇪🇺 Production EU | `https://api.eu.junction.com` | `pk_eu_*` |
| 🇺🇸 Sandbox US | `https://api.sandbox.us.junction.com` | `sk_us_*` |
| 🇪🇺 Sandbox EU | `https://api.sandbox.eu.junction.com` | `sk_eu_*` |

## Authentication

All requests require one of:

```http
x-vital-api-key: <YOUR_API_KEY>
# or
Authorization: Bearer <TEAM_API_ACCESS_TOKEN>
```

Short-lived tokens can be minted via the Management API (`POST /management/team/access-token`).

## SDKs

| Language | Package |
|---|---|
| TypeScript | `@junction-api/sdk` |
| Python | `junction-api-sdk` |
| Java | `junction-java` |
| Go | `junction-go` |

```typescript
import { JunctionClient, JunctionEnvironment } from "@junction-api/sdk";

const client = new JunctionClient({
  apiKey: process.env.JUNCTION_SANDBOX_API_KEY,
  environment: JunctionEnvironment.Sandbox,
});
```

The SDK includes: typed request/response interfaces, automatic retries (408/429/5xx), 60s timeout, `JunctionError` typed exceptions, and a `client.fetch()` escape hatch for any uncovered endpoint.

## Sandbox Limits

- Max **50 users** per sandbox team
- Demo device connections **expire after 7 days**
- Orders stay frozen at `ordered` status until manually simulated
