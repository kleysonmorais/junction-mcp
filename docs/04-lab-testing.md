# Junction API — Lab Testing

> Source: https://docs.junction.com/lab/*

## Core Concepts

- **Marker** — individual orderable test at the lab level (e.g., Vitamin D, TSH)
- **Lab Test** — a preset collection of markers with a fixed collection method
- **Order** — a placed request for a patient to undergo a lab test
- **Order Transaction** — groups related orders (initial + any redraws) together

## Collection Methods

| Method | Description |
|---|---|
| `testkit` | At-home kit shipped to patient |
| `walk_in_test` | Patient visits a PSC (Quest, Labcorp, BioReference) |
| `at_home_phlebotomy` | Mobile phlebotomist visits patient |
| `on_site_collection` | Collection at customer's facility (beta) |

## Prerequisites

Before placing any order:

```http
# 1. Get lab account ID
GET /v3/lab_test/lab_account
→ response.data[0].id  # use as lab_account_id on all orders

# 2. List available lab tests
GET /v3/lab_tests/
→ array of { id, method, status, name, markers[] }
# Filter for status === "active", build map: method → id
```

## User Creation (required before ordering)
```http
POST /v2/user/
Body: { "client_user_id": "unique_id" }
→ returns user_id
```

## Browsing Tests & Markers
```http
GET /v3/lab_tests/                     # list all active lab tests (deprecated, no pagination)
GET /v3/lab_test/{lab_test_id}         # get specific test with markers
GET /v3/lab_tests/markers              # browse full marker compendium
GET /v3/lab_tests/{id}/markers         # markers for a specific test
```

## Creating a Custom Lab Test
```http
POST /v3/lab_tests
Body: {
  "name": "...",
  "description": "...",
  "method": "walk_in_test",
  "provider_ids": ["322022", "006056"]  // or marker_ids
}
```
Returns `is_active: false` until Junction approves. Check status via `GET /v3/lab_tests/{id}`.

## Placing an Order
```http
POST /v3/order/
Header: X-Idempotency-Key: <uuid>     # recommended for safe retries
Body: {
  "user_id": "<uuid>",
  "lab_test_id": "<uuid>",            // or use order_set for multi/à la carte
  "lab_account_id": "<uuid>",
  "patient_details": {
    "first_name": "...",              // must pass name validation regex
    "last_name": "...",
    "dob": "YYYY-MM-DD",
    "gender": "male|female",
    "phone_number": "+1...",
    "email": "..."
  },
  "patient_address": {
    "receiver_name": "...",
    "first_line": "...",
    "city": "...",
    "state": "...",
    "zip": "...",
    "country": "US",
    "phone_number": "+1..."
  },
  "collection_method": "testkit",     // optional if set on lab test
  "billing_type": "client_bill",      // default
  "priority": false
}
```

### order_set field (advanced ordering)
```json
// Single lab test (standard)
{ "order_set": { "lab_test_ids": ["<id>"] } }

// Multiple lab tests (same lab only)
{ "order_set": { "lab_test_ids": ["<id1>", "<id2>"] } }

// À la carte markers (team config required)
{ "order_set": { "add_on": { "provider_ids": ["322022"] } } }
```

## Registrable Testkit (ship without patient binding)
```http
POST /v3/order/testkit
Body: { user_id, lab_test_id, lab_account_id, shipping_details: {...} }
# Order lands at: received.testkit.awaiting_registration

POST /v3/order/testkit/register
Body: { user_id, sample_id, patient_details, patient_address, physician? }
# Order progresses normally after registration
```

## Scheduled Orders
```http
POST /v3/order/
Body: { ..., "activate_by": "YYYY-MM-DD" }
# Order is deferred until the specified date
```

## Order Management
```http
GET  /v3/orders                        # list orders (filterable)
GET  /v3/order/{order_id}              # get single order
POST /v3/order/{order_id}/cancel       # cancel order
```

## PSC Appointment Scheduling (Walk-in, Quest only)
```http
GET  /v3/order/area/info?zip_code=...                # check coverage + supported_bill_types
GET  /v3/order/psc/info?zip_code=...                 # find PSCs with site_code + capabilities
POST /v3/order/{order_id}/appointment/psc/availability  # get available slots
POST /v3/order/{order_id}/appointment/psc/book          # book appointment
PATCH /v3/order/{order_id}/appointment/psc/reschedule   # reschedule
DELETE /v3/order/{order_id}/appointment/psc/cancel      # cancel appointment only
```

## Order Lifecycle Status Format

Statuses use namespaced format: `{HIGH_LEVEL}.{MODALITY}.{LOW_LEVEL}`

### High-level statuses
`received` → `collecting_sample` → `sample_with_lab` → `completed` | `cancelled` | `failed`

### Full status lists by modality

**Testkit:** `received.testkit.ordered` → `received.testkit.requisition_created` → `collecting_sample.testkit.transit_customer` → `collecting_sample.testkit.out_for_delivery` → `collecting_sample.testkit.with_customer` → `collecting_sample.testkit.transit_lab` → `sample_with_lab.testkit.delivered_to_lab` → `completed.testkit.completed`

**Walk-in:** `received.walk_in_test.ordered` → `received.walk_in_test.requisition_created` → `collecting_sample.walk_in_test.appointment_pending` → `collecting_sample.walk_in_test.appointment_scheduled` → `completed.walk_in_test.completed`

**At-home phlebotomy:** Similar to walk-in with `at_home_phlebotomy` modality token.

**Terminal failure states:** `failed.testkit.sample_error`, `failed.testkit.lost`, `cancelled.testkit.cancelled`, etc.

## Results

### Get JSON results
```http
GET /v3/order/{order_id}/result
```
Response:
```json
{
  "metadata": { "patient", "laboratory", "interpretation", "date_reported", ... },
  "results": [
    {
      "name": "...", "slug": "...", "value": 30.4, "result": "30.4",
      "type": "numeric|comment|range|coded_value",
      "unit": "...", "min_range_value": ..., "max_range_value": ...,
      "is_above_max_range": false, "is_below_min_range": false,
      "interpretation": "normal|abnormal|critical",
      "loinc": "...", "provider_id": "..."
    }
  ],
  "missing_results": [...],
  "order_transaction": { "id": "...", "status": "...", "orders": [...] }
}
```

### Get PDF results
```http
GET /v3/order/{order_id}/result/pdf
```

### Order Transaction results (combined across redraws)
```http
GET /v3/order_transaction/{order_transaction_id}
GET /v3/order_transaction/{order_transaction_id}/result
GET /v3/order_transaction/{order_transaction_id}/result/pdf
```

## Redraws

A redraw is triggered when a walk-in order has missing results (lab error).
- Initial order transitions to `collecting_sample.walk_in_test.redraw_available`
- A new redraw order is auto-created with `origin: "redraw"` in the same `order_transaction`
- Redraw order follows normal lifecycle
- Use `GET /v3/order_transaction/{id}/result` for combined results

## Idempotency
```http
POST /v3/order/
Header: X-Idempotency-Key: <uuid-v4>
```
Keys expire after 24 hours. Use deterministic UUID v5 from a stable scenario name for re-runnable scripts.
