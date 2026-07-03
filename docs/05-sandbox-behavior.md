# Junction Sandbox — Behavior Reference

> Source: https://docs.junction.com/lab/overview/sandbox

## What's Pre-Configured

Every new sandbox team includes:
- **4 default Lab Tests** — one per collection method (testkit, walk_in_test, at_home_phlebotomy, on_site_collection)
- **Junction physician network** — no physician setup needed; omit the `physician` field to use it automatically
- **Mock Quest PSC appointment slots** — auto-generated, no real Quest API needed
- **Simulated result generation** — fake results auto-generated based on test markers

## Sandbox vs Production Differences

| Feature | Sandbox | Production |
|---|---|---|
| Order progression | **Manual trigger required** | Automatic |
| PDF results | Static example PDF | Dynamic lab-generated |
| Shipping account numbers | Hardcoded `1234567890` | Real lab account numbers |
| At-home phlebotomy zip codes | **Only 85004 and 54650** | Full coverage |
| Quest PSC timezone | Always `America/New_York` | Actual PSC timezone |
| Quest PSC slots | Mock (same-day until 5PM, future 7AM–12PM, 20min intervals) | Real Quest API |

## Simulating Order Lifecycle

Orders are frozen at `ordered` status in sandbox until manually triggered:

```http
POST /v3/order/{order_id}/test?final_status=<status>
Body: {
  "interpretation": "normal|abnormal|critical|unknown",
  "result_types": ["numeric", "comment", "range", "coded_value"],
  "has_missing_results": true|false
}
```

- `final_status` is a **query parameter**, not a body field
- Omitting `final_status` simulates through all states to completion
- Triggering fires all expected webhooks, emails, and SMS
- Setting `interpretation: "critical"` triggers the full critical result workflow

## Result Customization

### interpretation
```json
{ "interpretation": "critical" }
```
`normal` (default) | `abnormal` | `critical` | `unknown`

### result_types
```json
{ "result_types": ["numeric", "comment"] }
```
Omitting cycles through all types. Types: `numeric`, `comment`, `range`, `coded_value`

### has_missing_results
```json
{ "has_missing_results": true }
```
Simulates incomplete lab processing. Triggers redraw eligibility flow.

## At-Home Phlebotomy Restrictions

Only two zip codes work in sandbox:

| Zip | City | Provider |
|---|---|---|
| `85004` | Phoenix, AZ | Getlabs |
| `54650` | La Crosse, WI | PhlebFinders |

Address for 85004: West Lincoln Street, Phoenix, AZ 85004, USA

## Demo Device Connections

- Available providers: `fitbit`, `oura`, `freestyle_libre`, `apple_health_kit`
- 30 days of historical data auto-backfilled
- Incremental data updates every few hours
- **Expire after 7 days** — must be re-created
- Data only available in `Summary` format (not Raw/Stream)

## Webhooks in Sandbox

Webhooks are **not required** for sandbox exploration. All data is accessible via pull APIs:
- Order status → `GET /v3/order/{id}`
- Results → `GET /v3/order/{id}/result`
- Device data → `GET /v3/summary/{resource}/{user_id}`
- Backfill status → `GET /v3/introspection/historical_pulls`
- Connections → `GET /v2/user/providers/{user_id}`
