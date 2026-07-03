# Junction API — Core Platform

> Source: https://docs.junction.com/api-details/junction-api

## User Management

### Create User
```http
POST /v2/user/
Body: { "client_user_id": "your_unique_id" }
```
Returns `user_id` (UUID) — store this, it's used in all subsequent calls.

### Resolve User by Client ID (idempotency check)
```http
GET /v2/user/resolve/{client_user_id}
```
Returns 404 if not found. Use this before creating to avoid duplicates.

### Get User
```http
GET /v2/user/{user_id}
```

### List Users
```http
GET /v2/users
```

### Update User
```http
PATCH /v2/user/{user_id}
```

### Update User Demographics
```http
PATCH /v2/user/{user_id}/info
Body:
{
  "first_name": "...",     // must match name validation regex
  "last_name": "...",      // must match name validation regex
  "email": "...",
  "phone_number": "+1...", // E.164
  "gender": "male|female",
  "dob": "YYYY-MM-DD",
  "address": {
    "first_line": "...",
    "zip_code": "...",
    "state": "...",
    "city": "..."
  }
}
```

Optional demographic fields: `race`, `ethnicity`, `sexual_orientation`, `gender_identity`.

**Name validation regex:**
```
^([a-zA-Z0-9]{1})([a-zA-Z0-9-.,']*(\s[a-zA-Z0-9-.,']+)*[a-zA-Z0-9-.,']?)$
```
No accented characters. Must start alphanumeric. No consecutive spaces.

### Get User Demographics
```http
GET /v2/user/{user_id}/info
```

### Delete / Undo Delete User
```http
DELETE /v2/user/{user_id}
POST   /v2/user/{user_id}/undo-delete
```

### Create Sign-In Token (for Mobile SDK)
```http
POST /v2/user/{user_id}/sign_in_token
```
Returns a short-lived token for signing into Junction Mobile SDKs.

### Create Portal URL
```http
POST /v2/user/{user_id}/portal-url
```

## Webhooks

Junction uses **push-based** webhooks via Svix.

- **Not required** for sandbox data exploration — all data is available via pull APIs
- Useful for production systems that need to react to events in real time

### Event lifecycle

1. `provider.connection.created` — user connects a device
2. `historical.data.{resource}.created` — backfill complete for a resource
3. `daily.data.{resource}.created` / `.updated` — incremental data available
4. `labtest.order.created` / `.updated` — order status changed
5. `labtest.result.critical` — critical lab result triggered

### Webhook management
```http
POST   /org/team/webhook       # create
GET    /org/team/webhook/{id}  # get
PATCH  /org/team/webhook/{id}  # update
DELETE /org/team/webhook/{id}  # delete
```

Webhooks are signed via Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`).
