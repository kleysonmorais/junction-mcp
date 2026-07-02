# Synthetic Data (Sandbox)

Guide to creating demo device connections in Junction's sandbox, used to generate test wearable data without a real device. Source: [Junction Test Data docs](https://docs.junction.com/wearables/providers/test_data).

Set these as environment variables and never commit real values:

```bash
export JUNCTION_API_KEY="sk_us_your_key_here"
export USER_ID="your_junction_user_id"
```

## Endpoint

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/v2/link/connect/demo` | Creates a demo provider connection for a Junction user, backfilling simulated wearable data |

**Prerequisite:** the `user_id` must already exist as a Junction user (created via the dashboard or the users API) before connecting a demo provider.

## Available Demo Providers

| Provider | Value |
|---|---|
| Apple HealthKit | `apple_health_kit` |
| Fitbit | `fitbit` |
| Freestyle Libre | `freestyle_libre` |
| Oura | `oura` |

## Example Scenarios

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

## Demo Data Characteristics

- On connection, Junction backfills **30 days of historical data** and continues to simulate periodic updates, as if from a real device.
- Demo users **expire after 7 days** — the user and all its data are deleted automatically.
- Demo connections only work in **sandbox** environments, never production.
- Data from demo connections is only available in **Summary** format (not Raw or Stream) — use the `/summary/<resource>/<user_id>` endpoints described in [GET Summary.md](GET%20Summary.md) to read it back.

