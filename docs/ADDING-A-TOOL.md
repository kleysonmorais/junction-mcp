# Checklist — adding a new MCP tool

Every tool touches more than its own file. Work top-down: wire the API first, register
the tool, then update the three surfaces that advertise the tool set (agent, docs, UI).
The core is transport-agnostic — one registration reaches `/mcp`, `/mcp-demo`, and stdio
alike, so you never edit the transports.

## 1. Client method — `packages/junction-mcp/src/junction/client.ts`
- [ ] Add a typed method that wraps the endpoint. Keep it a thin pass-through
      (build the path, pass a `Query` object) — no business logic here.
- [ ] Model the query params with a precise TS type (unions for enums). If a value is
      required by the API, make it required in the signature.
- [ ] **Verify the real endpoint first** with `curl` against the sandbox before you
      guess the shape — trailing-slash redirects, envelope keys (`{ users }` vs `{ data }`),
      and required params are all things the API dictates, not the docs. See the notes in
      [04-lab-testing.md](04-lab-testing.md) for gotchas already found this way.

## 2. Tool file — `packages/junction-mcp/src/mcp/tools/<name>.ts`
- [ ] One file, one `register<Name>(server, client)` export. Copy the shape of an
      existing tool (e.g. [search-users](../packages/junction-mcp/src/mcp/tools/search-users.ts)).
- [ ] `inputSchema` is Zod. Reuse shared schemas from
      [tools/shared.ts](../packages/junction-mcp/src/mcp/tools/shared.ts)
      (`userIdSchema`, `dateSchema`, `dateTimeSchema`) — don't redefine them.
- [ ] Every param gets a `.describe(...)`. This is what the agent reads to decide when
      and how to call the tool — write it for the model, not for a human.
- [ ] The `description` should say **when to prefer this tool over a sibling**
      (e.g. "prefer search_users over list_users when you know a name"). Ambiguity here
      is the #1 cause of the agent picking the wrong tool.
- [ ] Wrap the client call in `try/catch` and return `errorResult(err)` on failure —
      never let it throw a protocol error.
- [ ] Return via `jsonResult(...)`.

## 3. Register it — `packages/junction-mcp/src/mcp/server.ts`
- [ ] `import { register<Name> } from "./tools/<name>";`
- [ ] Call `register<Name>(server, client)` inside `registerJunctionTools`, positioned
      next to its logical siblings (search tool beside its list/get counterpart).

## 4. Smoke test — `packages/junction-mcp/scripts/smoke.ts`
- [ ] Add a `step("<name>(...)", () => client.<method>(...))` so the new path is
      exercised against the live sandbox.
- [ ] Run `pnpm smoke` from the repo root — every step must print `✓`.

## 5. Agent guidance — `apps/demo-web/app/api/chat/route.ts`
- [ ] Update `SYSTEM_PROMPT` so the agent knows the tool exists and when to reach for it.
      The Tool Explorer discovers tools dynamically, but the chat agent leans on this prose.
- [ ] Consider adding/adjusting a scenario in
      [scenarios.ts](../apps/demo-web/components/scenarios.ts) to showcase it, and update the
      `sub` tool-hint labels of any scenario whose flow now changes.

## 6. Home page — `apps/demo-web/components/Home.tsx`
- [ ] Add a row to the `TOOLS` array (name, description, endpoint), placed next to siblings.
- [ ] Bump the tool count: the `<Chip>N MCP tools</Chip>` in `Hero` **and** the
      `SectionHeading title="… tools, the whole sandbox"` in `ToolsSection`.
- [ ] If the tool changes the headline "flag abnormal" flow, update the `ChatPreview`
      tool-call trace to match.

> The Tool Explorer ([ToolExplorer.tsx](../apps/demo-web/components/ToolExplorer.tsx)) needs
> **no change** — it lists tools live from `/mcp-demo` and renders inputs from the schema.

## 7. Docs — `docs/`
- [ ] Document the endpoint in the matching reference doc
      ([02-core-platform.md](02-core-platform.md) for `/v2/user*`,
      [04-lab-testing.md](04-lab-testing.md) for `/v3/*`), including the **real response
      envelope** you captured in step 1 and any param table.
- [ ] Add the tool row to the table in [../README.md](../README.md#tools).
- [ ] Bump the tool count in [ARCHITECTURE.md](ARCHITECTURE.md) ("binds the N tools").

## 8. Verify the whole thing
- [ ] `pnpm typecheck` (whole workspace) is clean.
- [ ] `pnpm smoke` — all steps `✓`.
- [ ] Boot the demo (`pnpm dev`) and confirm the tool appears via the live endpoint:
      ```bash
      curl -s -X POST http://localhost:3000/mcp-demo \
        -H "content-type: application/json" -H "accept: application/json, text/event-stream" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
      ```
      then invoke it once with `"method":"tools/call"` and confirm real data comes back and
      that a missing required arg returns a validation error.

---

### Grep-able count references (keep in sync)
When the tool count changes, these are the spots that hardcode it:

| Where | Text |
|---|---|
| `apps/demo-web/components/Home.tsx` | `<Chip>N MCP tools</Chip>` |
| `apps/demo-web/components/Home.tsx` | `SectionHeading title="… tools, the whole sandbox"` |
| `docs/ARCHITECTURE.md` | "binds the N tools to a `JunctionClient`" |

`README.md` and the `docs/` API references list tools by row, not by count — no number to bump there.
