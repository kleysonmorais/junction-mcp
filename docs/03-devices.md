# Junction API — Devices (Wearables)

> Source: https://docs.junction.com/wearables/*

## Overview

Junction connects to 300+ health data providers across four connection types:
- **OAuth** (cloud-based: Fitbit, Oura, Garmin, Strava, Withings, etc.)
- **Password** (Zwift, Peloton, Eight Sleep, etc.)
- **SDK-based** (Apple HealthKit, Android Health Connect, Samsung Health)
- **Bluetooth** (Omron, Beurer, Contour)

## Key Concepts

### Providers
```http
GET /v2/providers          # list all providers + their supported_resources
```

### User Connections
```http
GET  /v2/user/providers/{user_id}      # list connected providers + resource availability
POST /v2/user/refresh/{user_id}        # trigger immediate data refresh
DELETE /v2/user/{user_id}/providers/{provider}  # deregister connection
```

### Link Flow (connecting real devices)
1. Backend: `POST /v2/link/token` → get a link token
2. Frontend: Open Junction Link Widget or call `GET /v2/link/provider/oauth/{provider}` (OAuth)
3. Junction fires `provider.connection.created` webhook on success

## Demo Connections (Sandbox Only)

No real device needed. Creates synthetic data automatically.

```http
POST /v2/link/connect/demo
Body: { "user_id": "<uuid>", "provider": "<slug>" }
```

### Supported demo providers
| Slug | Data available |
|---|---|
| `fitbit` | activity, sleep, body, workouts, heartrate, steps, hrv, blood_oxygen |
| `oura` | activity, sleep, body, heartrate, hrv, respiratory_rate |
| `freestyle_libre` | glucose (high-frequency CGM timeseries) |
| `apple_health_kit` | activity, sleep, body, workouts |

### Demo behavior
- **30 days** of historical data backfilled automatically
- Incremental data updates simulated every few hours
- Connections **expire after 7 days** — must be re-created
- Only `Summary` data format available (not Raw or Stream)
- Demo users cannot also have real device connections

### Idempotency check before creating
```http
GET /v2/user/providers/{user_id}
# Check if provider slug appears with status: "connected"
```

### Prerequisite
The `user_id` must already exist as a Junction user (created via the dashboard or the users API) before connecting a demo provider.

### Example requests (curl)

Set as environment variables and never commit real values:
```bash
export JUNCTION_API_KEY="sk_us_your_key_here"
export USER_ID="your_junction_user_id"
```

<details>
<summary>Connect Apple HealthKit demo data</summary>

```bash
curl --request POST \
     --url https://api.sandbox.us.junction.com/v2/link/connect/demo \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY" \
     --data "{\"user_id\": \"$USER_ID\", \"provider\": \"apple_health_kit\"}"
```
</details>

<details>
<summary>Connect Fitbit demo data</summary>

```bash
curl --request POST \
     --url https://api.sandbox.us.junction.com/v2/link/connect/demo \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY" \
     --data "{\"user_id\": \"$USER_ID\", \"provider\": \"fitbit\"}"
```
</details>

<details>
<summary>Connect Freestyle Libre demo data</summary>

```bash
curl --request POST \
     --url https://api.sandbox.us.junction.com/v2/link/connect/demo \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY" \
     --data "{\"user_id\": \"$USER_ID\", \"provider\": \"freestyle_libre\"}"
```
</details>

<details>
<summary>Connect Oura demo data</summary>

```bash
curl --request POST \
     --url https://api.sandbox.us.junction.com/v2/link/connect/demo \
     --header 'Accept: application/json' \
     --header 'Content-Type: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY" \
     --data "{\"user_id\": \"$USER_ID\", \"provider\": \"oura\"}"
```
</details>

## Data Resources

Guide to Junction's data-retrieval API for wearable data.

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/sleep/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```

### Endpoint patterns

| Type | Method | Path | Purpose |
|---|---|---|---|
| Summary | `GET` | `/summary/<resource>/<user_id>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Aggregated data per calendar day or per session |
| Timeseries | `GET` | `/timeseries/<user_id>/<resource>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Time-ordered collection of individual data samples |

`start_date` / `end_date` scope both request types to a date range.

> **Provider variability:** Junction forwards provider data as-is, with no upsampling or downsampling. Available fields and sampling rates vary by provider and device — even when two providers expose the same resource, the fields populated can differ. A field being documented for a provider does **not** guarantee it will contain data on every request.

### Summary types (daily aggregates or sessions)

Summary endpoints return one aggregated object per day or per session, depending on the resource's granularity.

| Granularity | Resources |
|---|---|
| Daily | `activity` |
| Session | `sleep`, `sleep_cycle`, `workouts`, `body`, `meal`, `menstrual_cycle`, `electrocardiogram`, `workout_stream` |
| Single | `profile` |

```http
GET /v3/summary/activity/{user_id}?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
GET /v3/summary/sleep/{user_id}?start_date=...&end_date=...
GET /v3/summary/workouts/{user_id}?start_date=...&end_date=...
GET /v3/summary/body/{user_id}?start_date=...&end_date=...
GET /v3/summary/sleep_cycle/{user_id}?...
GET /v3/summary/meal/{user_id}?...
GET /v3/summary/menstrual_cycle/{user_id}?...
GET /v3/summary/electrocardiogram/{user_id}?...
GET /v3/summary/workout_stream/{user_id}?...
GET /v3/summary/profile/{user_id}   # single, no date range needed
```

**Example response fields — Workouts summary:** `user_id`, `title`, `timezone_offset`, `average_hr`, `max_hr`, `distance`, `time_start`, `time_end`, `calories`, `sport`, `hr_zones`, `moving_time`, `total_elevation_gain`, `average_speed`, `max_speed`, `provider_id`, `source`

### Timeseries types (discrete or interval samples)

Timeseries endpoints return an ordered list of individual samples, each with a `timestamp`. Resources fall into two shapes:

- **Discrete** — a single point-in-time value (e.g. one heart rate reading).
- **Interval** — a value tied to a start/end time range (e.g. steps taken over a 15-minute window).

| Shape | Category | Resources |
|---|---|---|
| Discrete | Cardiorespiratory | `respiratory_rate` |
| Discrete | Vitals | `blood_oxygen`, `blood_pressure`, `glucose`, `heartrate`, `hrv`, `electrocardiogram_voltage` |
| Discrete | Wellness | `stress_level` |
| Discrete | Body | `fat`, `weight` |
| Interval | Activity | `calories_active`, `calories_basal`, `distance`, `floors_climbed`, `steps`, `workout_duration`, `fall`, `wheelchair_push`, `stand_duration`, `stand_hour` |
| Interval | Body | `body_temperature`, `body_temperature_delta`, `insulin_injection`, `waist_circumference`, `body_mass_index`, `lean_body_mass`, `basal_body_temperature` |
| Interval | Vitals | `afib_burden`, `heart_rate_alert`, `forced_expiratory_volume_1`, `forced_vital_capacity`, `peak_expiratory_flow_rate`, `inhaler_usage`, `heart_rate_recovery_one_minute` |
| Interval | Cardiorespiratory | `vo2_max` |
| Interval | Nutrition | `carbohydrates`, `caffeine`, `water` |
| Interval | Wellness | `mindfulness_minutes`, `sleep_apnea_alert`, `sleep_breathing_disturbance`, `uv_exposure`, `daylight_exposure`, `handwashing` |
| Interval | Workout Stream | `workout_distance`, `workout_swimming_stroke` |
| Interval | Diary | `note` |

```http
GET /v3/timeseries/{user_id}/heartrate?start_date=...&end_date=...
GET /v3/timeseries/{user_id}/hrv?...
GET /v3/timeseries/{user_id}/glucose?...
GET /v3/timeseries/{user_id}/steps?...
GET /v3/timeseries/{user_id}/blood_oxygen?...
GET /v3/timeseries/{user_id}/blood_pressure?...
GET /v3/timeseries/{user_id}/calories_active?...
GET /v3/timeseries/{user_id}/distance?...
GET /v3/timeseries/{user_id}/stress_level?...
GET /v3/timeseries/{user_id}/respiratory_rate?...
GET /v3/timeseries/{user_id}/water?...
GET /v3/timeseries/{user_id}/weight?...
GET /v3/timeseries/{user_id}/body_temperature?...
GET /v3/timeseries/{user_id}/body_weight?...
GET /v3/timeseries/{user_id}/vo2_max?...
# + more timeseries resources — see table above
```

**Example response fields — Heartrate timeseries:** `timestamp`, `timezone_offset`, `value`, `type`, `unit`

### Timeseries sampling rate tiers

Because Junction doesn't resample provider data, the density of points you get back depends heavily on the resource and the source device. Use these tiers to set expectations for payload size and polling frequency:

| Tier | Density | Resources | Typical cadence |
|---|---|---|---|
| Very High Frequency | 1,000s–10,000s samples/day (second-level) | `heartrate`, `calories_active` | 1 sample every 3s (e.g. Apple Watch during a workout) down to every 1–15 min in the background (Apple/Fitbit/Garmin) |
| High Frequency | Hundreds of samples/day (minute-level) | `steps`, `glucose`, `stress_level`, `respiratory_rate` | 1 sample every 1 min or every 15 min |
| Sparse | ≤5 samples/day (day-level) | All remaining timeseries resources not listed above | Includes alert-type data (e.g. `heart_rate_alert`, `sleep_apnea_alert`) that may fire unpredictably or never during routine use |

**Practical implication:** if you're polling `heartrate` or `calories_active` over a wide date range, expect a large response and paginate or narrow the window; sparse resources can safely be polled less often.

### Introspection
```http
GET /v3/introspection/historical_pulls     # backfill job status per user/resource
GET /v3/introspection/user_resources       # which resources are available for a user
```