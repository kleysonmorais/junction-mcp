# Architecture

## Monorepo layout

A pnpm workspace with three cooperating projects:

```
packages/junction-mcp/   Publishable core — transport-agnostic tool registry
                         + typed Junction REST client. Ships the stdio binary.
apps/demo-web/           Next.js demo UI (Tool Explorer + Agent Chat) and the
                         HTTP MCP routes (/mcp, /mcp-demo, /api/chat). Depends on
                         junction-mcp via "workspace:*", imported as a bare specifier.
tools/synthetic-data/    Seeds/manages the synthetic Junction sandbox data.
```

The boundary is deliberate: the **core package** knows nothing about HTTP,
Next.js, or the demo. It exposes `registerJunctionTools()` and `JunctionClient`
from [packages/junction-mcp/src/index.ts](../packages/junction-mcp/src/index.ts)
and nothing else. Everything endpoint-specific — key resolution, origin
validation, the two HTTP routes — lives in the **app**, because it is policy for
*those transports*, not for the tool set. The stdio binary
([packages/junction-mcp/bin/stdio.ts](../packages/junction-mcp/bin/stdio.ts))
ships with the core because it is the package's own CLI entry point.

## Overview

```
Browser (Next.js UI)
  │
  ├─ Tool Explorer tab ──► POST /mcp-demo ──► (default sandbox key, zero setup)
  │                                             │
  │                                             └──► Junction Sandbox REST API
  │
  └─ Agent Chat tab ──► POST /api/chat ──► Vercel AI SDK (provider-agnostic LLM)
                            │                (agent picks tools, streams response)
                            └──► POST /mcp-demo (server-side MCP client)
                                    │
                                    └──► Junction Sandbox REST API

External MCP client (remote) ──► POST /mcp  (Authorization: Bearer <caller's key>)
Local MCP client (Claude Desktop / Inspector)
  └─ stdio subprocess (packages/junction-mcp/bin/stdio.ts) ──► same shared tools ──► Junction
```

One transport-agnostic core, three entry points. `registerJunctionTools()` in
[packages/junction-mcp/src/mcp/server.ts](../packages/junction-mcp/src/mcp/server.ts)
binds the 8 tools to a `JunctionClient` instance; the HTTP routes, the stdio
binary, and the agent all reuse it unchanged. Only *how the Junction key
arrives* differs per entry point.

## Request flow (Agent Chat)

1. The browser posts the conversation to `/api/chat`.
2. The route creates an MCP client (`@ai-sdk/mcp` + the official SDK's
   `StreamableHTTPClientTransport`) pointed at the deployment's own
   `/mcp-demo` endpoint — the agent consumes the MCP server exactly like any
   external client would, rather than importing the tool functions directly.
   This keeps the demo honest: if the MCP layer breaks, the agent breaks.
3. `streamText` (Vercel AI SDK) runs the agent loop — up to 12 steps of tool
   calls — and streams UI-message chunks back to the browser, where `useChat`
   renders text and collapsible tool-call chips incrementally.

The LLM vendor is one line in
[apps/demo-web/app/api/chat/route.ts](../apps/demo-web/app/api/chat/route.ts)
(`model: anthropic(...)`); swapping to another `ai`-package provider changes
nothing else.

## Transport decisions

**Streamable HTTP, not SSE.** The HTTP+SSE transport from the 2024-11-05 MCP
spec is deprecated; Streamable HTTP (2025-03-26+) replaces it with a single
endpoint that can answer plain JSON or upgrade to a stream per request. Both
routes disable the legacy SSE endpoints entirely (`disableSse: true`).

**Stateless mode.** The MCP spec allows session state (`Mcp-Session-Id`);
we deliberately run without it:

- **Serverless-friendly** — Vercel functions are ephemeral; there is no shared
  memory between invocations to keep a session in. Stateless mode needs no
  Redis or sticky routing.
- **Security** — no session identifier exists to leak or hijack.
- **Cost** — each request creates a lightweight `McpServer` instance bound to
  the resolved key; construction does no I/O.

The trade-off is no server-initiated notifications (e.g. `listChanged` pushes)
— irrelevant here, since the tool set is fixed per deployment.

## /mcp vs /mcp-demo

| | `/mcp` | `/mcp-demo` |
|---|---|---|
| Audience | Developers pointing their own MCP client | The hosted demo UI + `/api/chat` |
| Key source | `Authorization: Bearer <key>` (or `x-vital-api-key`), per request | `JUNCTION_API_KEY` env var, server-side |
| Failure mode | Friendly JSON-RPC `401` explaining exactly what to send | `500` telling the deployer which env var is missing |

The split exists so the public demo can be zero-setup **without** ever exposing
the deployment's sandbox key: the key is resolved inside the route handler and
bound into the tool closure; it never reaches the browser. Meanwhile `/mcp`
stays a real bring-your-own-key server — the caller's key is shape-validated
(`sk_*`/`pk_*` pattern) before being forwarded upstream, so garbage never hits
Junction's API.

Because the transport is stateless, per-request key binding is trivial: the
handler is created fresh per request with the key captured in a closure. With
sessions this would require a key↔session store.

## stdio entry point

[packages/junction-mcp/bin/stdio.ts](../packages/junction-mcp/bin/stdio.ts)
connects the same tool registry to the official SDK's `StdioServerTransport`.
Local MCP clients (Claude Desktop, MCP Inspector)
spawn it as a subprocess and inject `JUNCTION_API_KEY` through the client
config's `env` block. Logging goes to stderr only — stdout belongs to the
JSON-RPC protocol.

## Security model

- **Origin validation**
  ([apps/demo-web/lib/security/origin.ts](../apps/demo-web/lib/security/origin.ts)) —
  browsers send an `Origin` header; anything not matching the deployment's own
  origin, localhost, or `ALLOWED_ORIGINS` gets a `403`. Non-browser MCP
  clients send no Origin and pass through. This is the MCP spec's
  DNS-rebinding countermeasure.
- **Key resolution**
  ([apps/demo-web/lib/auth/resolve-key.ts](../apps/demo-web/lib/auth/resolve-key.ts)) —
  described above. No secrets in URLs anywhere (the old SSE token-in-query
  antipattern). These live in the app, not the core package: they are policy
  for the HTTP transport, not for the tool set.
- **Tool-level guards** — date ranges are capped at 31 days, and dense
  timeseries (minute-level heartrate/hrv/glucose) are evenly downsampled to
  ≤400 points with min/max/avg stats, so a single tool call can't flood an
  LLM context window or the browser.
- **Errors as tool results** — Junction failures map to `isError: true` tool
  results with actionable hints (bad key vs. missing resource vs. rate limit),
  keeping the agent loop recoverable instead of crashing the protocol.

## Data on the demo team

[tools/synthetic-data/](../tools/synthetic-data/) seeds the sandbox this
server develops against: 8 users (`mcp_device_*` with fitbit/oura/
freestyle_libre demo connections backfilling ~30 days of synthetic data;
`mcp_lab_*` with 13+ lab orders spanning completed normal/abnormal/critical
results, mid-lifecycle freezes, a cancellation, and a future-scheduled order).
Demo device connections expire after 7 days; re-run the setup with
`--reset-devices` (`cd tools/synthetic-data && pnpm setup -- --reset-devices`).
