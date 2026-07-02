# Resources

## Timeseries Data (Device/User)

Guide to Junction's data-retrieval API for wearable data. Source: [Junction Resources docs](https://docs.junction.com/wearables/providers/resources).

All requests below use placeholder credentials. Set these as environment variables:

```bash
export JUNCTION_API_KEY="sk_us_your_key_here"
export USER_ID="your_junction_user_id"
```

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/sleep/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```

## Endpoint Patterns

| Type | Method | Path | Purpose |
|---|---|---|---|
| Summary | `GET` | `/summary/<resource>/<user_id>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Aggregated data per calendar day or per session |
| Timeseries | `GET` | `/timeseries/<user_id>/<resource>?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | Time-ordered collection of individual data samples |

`start_date` / `end_date` scope both request types to a date range.

> **Provider variability:** Junction forwards provider data as-is, with no upsampling or downsampling. Available fields and sampling rates vary by provider and device — even when two providers expose the same resource, the fields populated can differ. A field being documented for a provider does **not** guarantee it will contain data on every request.

## Summary Resources

Summary endpoints return one aggregated object per day or per session, depending on the resource's granularity.

| Granularity | Resources |
|---|---|
| Daily | `activity` |
| Session | `sleep`, `sleep_cycle`, `workouts`, `body`, `meal`, `menstrual_cycle`, `electrocardiogram`, `workout_stream` |
| Single | `profile` |

### Example scenarios

<details>
<summary>Activity summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/activity/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Workouts summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/workouts/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Body summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/body/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Sleep cycle summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/sleep_cycle/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Meal summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/meal/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Menstrual cycle summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/menstrual_cycle/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Electrocardiogram summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/electrocardiogram/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Workout stream summary</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/workout_stream/$USER_ID?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Profile (single, no date range needed)</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/summary/profile/$USER_ID" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

### Example response fields — Workouts summary

`user_id`, `title`, `timezone_offset`, `average_hr`, `max_hr`, `distance`, `time_start`, `time_end`, `calories`, `sport`, `hr_zones`, `moving_time`, `total_elevation_gain`, `average_speed`, `max_speed`, `provider_id`, `source`

## Timeseries Resources

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

### Example scenarios

<details>
<summary>Heart rate</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/heartrate?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Steps</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/steps?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Active calories</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/calories_active?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Glucose</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/glucose?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Heart rate variability (HRV)</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/hrv?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Blood oxygen</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/blood_oxygen?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Blood pressure</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/blood_pressure?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Weight</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/weight?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Water intake</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/water?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Respiratory rate</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/respiratory_rate?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

<details>
<summary>Stress level</summary>

```bash
curl --request GET \
     --url "https://api.sandbox.us.junction.com/v2/timeseries/$USER_ID/stress_level?start_date=2026-06-01&end_date=2026-07-01" \
     --header 'Accept: application/json' \
     --header "x-vital-api-key: $JUNCTION_API_KEY"
```
</details>

### Example response fields — Heartrate timeseries

`timestamp`, `timezone_offset`, `value`, `type`, `unit`

## Timeseries Sampling Rate Tiers

Because Junction doesn't resample provider data, the density of points you get back depends heavily on the resource and the source device. Use these tiers to set expectations for payload size and polling frequency:

| Tier | Density | Resources | Typical cadence |
|---|---|---|---|
| Very High Frequency | 1,000s–10,000s samples/day (second-level) | `heartrate`, `calories_active` | 1 sample every 3s (e.g. Apple Watch during a workout) down to every 1–15 min in the background (Apple/Fitbit/Garmin) |
| High Frequency | Hundreds of samples/day (minute-level) | `steps`, `glucose`, `stress_level`, `respiratory_rate` | 1 sample every 1 min or every 15 min |
| Sparse | ≤5 samples/day (day-level) | All remaining timeseries resources not listed above | Includes alert-type data (e.g. `heart_rate_alert`, `sleep_apnea_alert`) that may fire unpredictably or never during routine use |

**Practical implication:** if you're polling `heartrate` or `calories_active` over a wide date range, expect a large response and paginate or narrow the window; sparse resources can safely be polled less often.

