# junction-mcp

An open-source **MCP server** that exposes [Junction](https://docs.junction.com)'s wearable and lab-testing data to AI agents — query patient health with natural language instead of raw API calls.

Built on the **Junction sandbox** (synthetic data only), with a Next.js demo UI on top:

- **Agent Chat** — a provider-agnostic agent (Vercel AI SDK) that reasons over the MCP tools with streamed responses. Try "Review the completed lab orders and flag anything abnormal."
- **Tool Explorer** — invoke any MCP tool directly from the browser and inspect the raw JSON. Zero setup.

> ⚠️ Sandbox/synthetic data only. Not production-hardened for real PHI, and not medical advice.

## Repository layout

A pnpm workspace monorepo:

```
packages/
  junction-mcp/         # Publishable core: transport-agnostic tool registry + Junction client
    src/                #   index.ts barrel, mcp/, junction/
    bin/stdio.ts        #   local stdio entry point
apps/
  demo-web/             # Next.js demo UI (Tool Explorer + Agent Chat) and the HTTP MCP routes
tools/
  synthetic-data/       # Seeds/manages the synthetic Junction sandbox data
docs/                   # Architecture and API reference
```

The demo app depends on the core via `"junction-mcp": "workspace:*"` and imports it as a
bare specifier — consuming the MCP server exactly like any external package would.

## Tools

| Tool | Wraps |
|---|---|
| `list_users` | `GET /v2/user/` — every sandbox user + connected sources (no filter) |
| `search_users` | `GET /v2/user/search` — find users by name, email, phone, or client_user_id |
| `get_user_connections` | `GET /v2/user/providers/{user_id}` — providers + resource availability |
| `get_wearable_summary` | `GET /v2/summary/{activity\|sleep\|workouts\|body}/{user_id}` |
| `get_wearable_timeseries` | `GET /v2/timeseries/{user_id}/{resource}` — 10 metrics (glucose, heartrate, hrv, …), with stats + downsampling to ≤400 points |
| `list_lab_tests` | `GET /v3/lab_tests/` — full orderable test catalog with markers |
| `search_lab_tests` | `GET /v3/lab_test` — search the test catalog by name, with pagination |
| `search_lab_markers` | `GET /v3/lab_tests/markers` — search the marker/panel compendium (LOINC, units, provider ids) |
| `list_lab_orders` | `GET /v3/orders` — orders by user, free-text search, or date window, with lifecycle statuses |
| `get_lab_order` | `GET /v3/order/{order_id}` — status, events, tracking |
| `get_lab_results` | `GET /v3/order/{order_id}/result` — marker-level results with ranges + interpretations |
| `search_lab_results` | `GET /v3/result` — search results across patients by name/order/date, with interpretation flags |

All inputs are Zod-validated; Junction errors come back as agent-friendly tool errors, never protocol errors.

**Discovery vs. detail:** the `search_*` tools filter server-side and are the preferred entry point when the
agent already knows something about who or what it's looking for (a name, a marker, an abnormal flag). The
`list_*` tools dump the whole collection and are best for small sandbox teams or a first look. Search a
result across patients with `search_lab_results`, then drill into one order with `get_lab_results`.

## Endpoints

The same tool set is served three ways (shared, transport-agnostic core in [packages/junction-mcp/src/mcp/server.ts](packages/junction-mcp/src/mcp/server.ts)):

| Entry point | Transport | Junction key |
|---|---|---|
| `POST /mcp` | Streamable HTTP, stateless | **Yours**, per request: `Authorization: Bearer sk_us_...` |
| `POST /mcp-demo` | Streamable HTTP, stateless | Server's `JUNCTION_API_KEY` env var (powers the demo UI) |
| `packages/junction-mcp/bin/stdio.ts` | stdio | `JUNCTION_API_KEY` from the MCP client's env block |

### Point your own MCP client at it

Remote (Streamable HTTP):

```json
{
  "mcpServers": {
    "junction": {
      "url": "https://<your-deployment>/mcp",
      "headers": { "Authorization": "Bearer sk_us_your_sandbox_key" }
    }
  }
}
```

Local (stdio — Claude Desktop, MCP Inspector):

```json
{
  "mcpServers": {
    "junction": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/junction-mcp/packages/junction-mcp/bin/stdio.ts"],
      "env": { "JUNCTION_API_KEY": "sk_us_your_sandbox_key" }
    }
  }
}
```

## Setup

This is a pnpm workspace — install once at the root ([pnpm](https://pnpm.io) ≥ 11.9, Node ≥ 20):

```bash
pnpm install
```

1. **Get a Junction sandbox key** — create a sandbox team at [app.junction.com](https://app.junction.com) (keys look like `sk_us_*`).
2. **Seed the sandbox** with users, demo device connections, and lab orders:

   ```bash
   cp tools/synthetic-data/.env.example tools/synthetic-data/.env   # set JUNCTION_SANDBOX_API_KEY
   pnpm setup:sandbox
   ```

   Demo device connections expire after 7 days — re-run weekly with
   `cd tools/synthetic-data && pnpm setup -- --reset-devices`.
3. **Run the app:**

   ```bash
   cp apps/demo-web/.env.example apps/demo-web/.env.local   # set JUNCTION_API_KEY (+ ANTHROPIC_API_KEY for Agent Chat)
   pnpm dev
   ```

   Open http://localhost:3000. The Tool Explorer works with just the Junction key; Agent Chat additionally needs `ANTHROPIC_API_KEY` (swap providers by editing one line in [apps/demo-web/app/api/chat/route.ts](apps/demo-web/app/api/chat/route.ts) — the agent layer is the provider-agnostic `ai` package).

4. **Sanity checks** (run from the repo root):

   ```bash
   pnpm smoke        # exercises the Junction client against the live sandbox
   pnpm stdio        # runs the MCP server on stdio (speaks JSON-RPC on stdin/stdout)
   pnpm typecheck    # typechecks every workspace project
   ```

## Deploy to Vercel

```bash
vercel deploy
```

Set the environment variables `JUNCTION_API_KEY` and `ANTHROPIC_API_KEY` in the Vercel project (Settings → Environment Variables). Optionally `CHAT_MODEL`, `JUNCTION_BASE_URL` (defaults to US sandbox), and `ALLOWED_ORIGINS`.

## Security

- **Origin validation** on both MCP endpoints (DNS-rebinding guard per the MCP spec) — browser requests must come from the deployment's own origin, localhost, or `ALLOWED_ORIGINS`.
- **Stateless Streamable HTTP** — no sessions to hijack; each request is independent.
- **`/mcp` validates the caller's key shape** before ever forwarding it upstream, and returns a friendly `401` when missing or malformed.
- **Secrets stay server-side** — the demo sandbox key and LLM key live only in env vars; nothing is sent to the browser or put in URLs.
- **Rate-limit awareness** — the Junction client honors `Retry-After` on 429s with a single retry.
- **Zod validation** on every tool input.

More detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

[MIT](LICENSE)
