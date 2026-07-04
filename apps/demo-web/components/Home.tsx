"use client";

import { useState } from "react";
import Link from "next/link";
import { GITHUB_URL, VIEW_PATHS } from "./views";

/* ------------------------------------------------------------------ *
 * Shared primitives
 * ------------------------------------------------------------------ */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
      style={{
        borderColor: "var(--line)",
        background: "var(--panel)",
        color: "var(--sub)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--accent)" }}
      />
      {children}
    </span>
  );
}

function CodePill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-md px-2 py-1 font-mono text-xs"
      style={{ background: "var(--panel2)", color: "var(--sub)" }}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  to,
  href,
}: {
  children: React.ReactNode;
  to?: string;
  href?: string;
}) {
  const cls =
    "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-transform hover:-translate-y-px";
  const style = {
    background: "var(--btn-bg)",
    color: "var(--btn-ink)",
    boxShadow: "var(--shadow)",
  } as const;
  if (href)
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cls}
        style={style}
      >
        {children}
      </a>
    );
  return (
    <Link href={to ?? "/"} className={cls} style={style}>
      {children}
    </Link>
  );
}

function GhostButton({
  children,
  to,
}: {
  children: React.ReactNode;
  to: string;
}) {
  return (
    <Link
      href={to}
      className="inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-colors"
      style={{
        borderColor: "var(--line)",
        background: "var(--panel)",
        color: "var(--ink)",
      }}
    >
      {children}
    </Link>
  );
}

function SectionHeading({ title, aside }: { title: string; aside: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-3">
      <h2
        className="text-2xl font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h2>
      <span className="text-sm" style={{ color: "var(--faint)" }}>
        {aside}
      </span>
    </div>
  );
}

function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="text-xs transition-colors"
      style={{ color: copied ? "var(--ok)" : "var(--faint)" }}
    >
      {copied ? "copied ✓" : label}
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Data
 * ------------------------------------------------------------------ */

const TOOLS = [
  [
    "list_users",
    "Every sandbox user + their connected sources",
    "GET /v2/user/",
  ],
  [
    "search_users",
    "Find users by name, email, phone or client id",
    "GET /v2/user/search",
  ],
  [
    "get_user_connections",
    "Providers + resource availability per user",
    "GET /v2/user/providers/…",
  ],
  [
    "get_wearable_summary",
    "Daily aggregates — sleep, activity, workouts, body",
    "GET /v2/summary/…",
  ],
  [
    "get_wearable_timeseries",
    "10 intraday metrics with stats + downsampling to ≤400 points",
    "GET /v2/timeseries/…",
  ],
  [
    "list_lab_tests",
    "Full orderable test catalog with markers",
    "GET /v3/lab_tests/",
  ],
  [
    "search_lab_tests",
    "Search the test catalog by name, paginated",
    "GET /v3/lab_test",
  ],
  [
    "search_lab_markers",
    "Search the marker compendium — LOINC, units, ids",
    "GET /v3/lab_tests/markers",
  ],
  [
    "list_lab_orders",
    "Orders by user, search or date window",
    "GET /v3/orders",
  ],
  [
    "get_lab_order",
    "Status, events + tracking for one order",
    "GET /v3/order/…",
  ],
  [
    "get_lab_results",
    "Marker-level results with ranges + interpretations",
    "GET /v3/order/…/result",
  ],
  [
    "search_lab_results",
    "Search results across patients by name/date/flag",
    "GET /v3/result",
  ],
] as const;

const CLIENTS = [
  {
    name: "Claude Desktop",
    img: "claude-desktop.png",
    desc: "Local over stdio — paste one block into your config; the key stays in the env.",
    pill: "bin/stdio.ts",
  },
  {
    name: "Cursor",
    img: "cursor.png",
    desc: "Remote Streamable HTTP — point at the deployment with your sandbox key.",
    pill: "POST /mcp",
  },
  {
    name: "MCP Inspector",
    img: "mcp-inspector.png",
    desc: "Debug every tool, schema and raw result interactively over stdio.",
    pill: "npx @modelcontextprotocol/inspector",
  },
] as const;

const REMOTE_CONFIG = `{
  "mcpServers": {
    "junction": {
      "url": "https://your-app.vercel.app/mcp",
      "headers": { "Authorization": "Bearer sk_us_your_sandbox_key" }
    }
  }
}`;

const STDIO_CONFIG = `{
  "mcpServers": {
    "junction": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/junction-mcp/bin/stdio.ts"],
      "env": { "JUNCTION_API_KEY": "sk_us_your_sandbox_key" }
    }
  }
}`;

const ENDPOINTS = [
  ["POST /mcp", "Streamable HTTP · your key"],
  ["bin/stdio.ts", "stdio · local clients"],
] as const;

const SECURITY = [
  "Origin-validated on both MCP endpoints (DNS-rebinding guard)",
  "Stateless HTTP — no sessions to hijack",
  "Secrets stay server-side · Zod on every tool input",
] as const;

/* ------------------------------------------------------------------ *
 * Sections
 * ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="grid items-start gap-10 lg:grid-cols-2">
      <div>
        <Chip>open-source mcp server · wearables + labs</Chip>
        <h1
          className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          Your health data, fluent in natural language.
        </h1>
        <p
          className="mt-5 max-w-xl text-[15px] leading-relaxed"
          style={{ color: "var(--sub)" }}
        >
          junction-mcp exposes Junction&rsquo;s wearable streams and lab testing
          to AI agents over MCP. Ask about glucose trends or flag abnormal labs
          — natural language in, real tool calls out.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <PrimaryButton to={VIEW_PATHS["Agent Chat"]}>
            Try Agent Chat →
          </PrimaryButton>
          <GhostButton to={VIEW_PATHS["Tool Explorer"]}>
            Open Tool Explorer
          </GhostButton>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip>12 MCP tools</Chip>
          <Chip>Streamable HTTP + stdio</Chip>
          <Chip>sandbox · MIT</Chip>
        </div>
      </div>

      <ChatPreview />
    </section>
  );
}

function ChatPreview() {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: "var(--panel)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow-lg)",
        backgroundImage: "var(--glow)",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top right",
      }}
    >
      <div
        className="flex items-center gap-2 border-b pb-3 text-xs"
        style={{ borderColor: "var(--line)", color: "var(--faint)" }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: "var(--ok)" }}
        />
        <span className="font-mono">agent chat · live over the demo sandbox</span>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <div
          className="ml-auto max-w-[85%] rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--user-bg)", color: "var(--user-ink)" }}
        >
          Review the completed lab orders and flag anything abnormal.
        </div>

        <div
          className="w-fit rounded-lg border px-3 py-1.5 font-mono text-xs"
          style={{
            borderColor: "var(--line)",
            color: "var(--sub)",
            background: "var(--panel2)",
          }}
        >
          → search_lab_results(interpretation flags)
        </div>
        <div
          className="w-fit rounded-lg border px-3 py-1.5 font-mono text-xs"
          style={{
            borderColor: "var(--line)",
            color: "var(--sub)",
            background: "var(--panel2)",
          }}
        >
          → get_lab_results(order_id:{" "}
          <span style={{ color: "var(--accent-text)" }}>
            &quot;ord_7fa2&quot;
          </span>
          )
        </div>

        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{ background: "var(--panel2)", color: "var(--ink)" }}
        >
          2 of 6 orders are completed. One flag:{" "}
          <strong>ferritin 9 ng/mL — below range</strong> on the Women&rsquo;s
          Health panel…
        </div>
      </div>
    </div>
  );
}

function ByocBar() {
  return (
    <div
      className="mt-14 flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3.5"
      style={{
        background: "var(--panel)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--faint)" }}
      >
        Bring your own client
      </span>
      <CodePill>POST /mcp</CodePill>
      <CodePill>Authorization: Bearer sk_us_…</CodePill>
      <div className="ml-auto">
        <CopyButton text="POST /mcp" label="Copy endpoint" />
      </div>
    </div>
  );
}

function ToolsSection() {
  return (
    <section className="mt-16">
      <SectionHeading
        title="Twelve tools, one MCP endpoint"
        aside="users · wearables · lab testing"
      />
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: "var(--panel)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        {TOOLS.map(([name, desc, endpoint], i) => (
          <div
            key={name}
            className="grid grid-cols-1 items-center gap-1 px-5 py-4 sm:grid-cols-[minmax(0,220px)_1fr_auto] sm:gap-4"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
          >
            <span
              className="font-mono text-sm"
              style={{ color: "var(--accent-text)" }}
            >
              {name}
            </span>
            <span className="text-sm" style={{ color: "var(--sub)" }}>
              {desc}
            </span>
            <span
              className="font-mono text-xs sm:text-right"
              style={{ color: "var(--faint)" }}
            >
              {endpoint}
            </span>
          </div>
        ))}
        <div
          className="px-5 py-3.5 text-sm"
          style={{
            borderTop: "1px solid var(--line)",
            background: "var(--panel2)",
            color: "var(--sub)",
          }}
        >
          All inputs{" "}
          <strong style={{ color: "var(--ink)" }}>Zod-validated</strong> ·
          Junction errors return as agent-friendly tool errors, never protocol
          errors
        </div>
      </div>
    </section>
  );
}

function ClientsSection() {
  return (
    <section className="mt-16">
      <SectionHeading
        title="Works with your MCP client"
        aside="same tools over Streamable HTTP or stdio"
      />
      <div className="grid gap-5 md:grid-cols-3">
        {CLIENTS.map((c) => (
          <div
            key={c.name}
            className="flex flex-col overflow-hidden rounded-2xl border"
            style={{
              background: "var(--panel)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div
              className="jmcp-placeholder flex h-44 items-center justify-center border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <div
                className="rounded-md border px-3 py-2 text-center font-mono text-[11px]"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--panel)",
                  color: "var(--faint)",
                }}
              >
                <div>[ {c.name.toLowerCase()} screenshot ]</div>
                <div className="opacity-70">replace screenshots/{c.img}</div>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--ink)" }}
              >
                {c.name}
              </h3>
              <p
                className="mt-1.5 flex-1 text-sm leading-relaxed"
                style={{ color: "var(--sub)" }}
              >
                {c.desc}
              </p>
              <div className="mt-4">
                <CodePill>{c.pill}</CodePill>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConnectSection() {
  const [tab, setTab] = useState<"remote" | "stdio">("remote");
  const config = tab === "remote" ? REMOTE_CONFIG : STDIO_CONFIG;

  return (
    <section className="mt-16">
      <SectionHeading
        title="Connect in one paste"
        aside="one shared core · three entry points"
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Code panel */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "var(--code-bg)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div className="flex items-center gap-2 px-4 py-3">
            {(["remote", "stdio"] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: active
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                    color: active ? "var(--code-text)" : "var(--code-dim)",
                  }}
                >
                  {t === "remote" ? "Remote · HTTP" : "Claude Desktop · stdio"}
                </button>
              );
            })}
            <div className="ml-auto">
              <CopyButton text={config} label="copy" />
            </div>
          </div>
          <pre
            className="overflow-x-auto px-5 pb-5 pt-1 font-mono text-[13px] leading-relaxed"
            style={{ color: "var(--code-text)" }}
          >
            {config}
          </pre>
        </div>

        {/* Entry points panel */}
        <div
          className="rounded-2xl border p-6"
          style={{
            background: "var(--panel)",
            borderColor: "var(--line)",
            boxShadow: "var(--shadow)",
          }}
        >
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--ink)" }}
          >
            One core, two entry points
          </h3>
          <div className="mt-5 space-y-4">
            {ENDPOINTS.map(([code, note]) => (
              <div
                key={code}
                className="flex items-center justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                style={{ borderColor: "var(--line)" }}
              >
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--ink)" }}
                >
                  {code}
                </span>
                <span
                  className="text-right text-xs"
                  style={{ color: "var(--faint)" }}
                >
                  {note}
                </span>
              </div>
            ))}
          </div>
          <ul className="mt-6 space-y-2.5">
            {SECURITY.map((s) => (
              <li
                key={s}
                className="flex items-start gap-2.5 text-sm"
                style={{ color: "var(--sub)" }}
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--ok)" }}
                />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section
      className="mt-16 rounded-2xl border px-6 py-12 text-center"
      style={{
        background: "var(--panel)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow)",
      }}
    >
      <h2
        className="text-2xl font-semibold tracking-tight"
        style={{ color: "var(--ink)" }}
      >
        Zero setup — try it on the demo sandbox key.
      </h2>
      <p
        className="mx-auto mt-3 max-w-xl text-sm"
        style={{ color: "var(--sub)" }}
      >
        Agent Chat runs a real agent loop; Tool Explorer hits the raw tools.
        Nothing to install.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <PrimaryButton to={VIEW_PATHS["Agent Chat"]}>
          Try Agent Chat →
        </PrimaryButton>
        <GhostButton to={VIEW_PATHS["Tool Explorer"]}>
          Open Tool Explorer
        </GhostButton>
      </div>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-block text-sm"
        style={{ color: "var(--accent-text)" }}
      >
        or read the source on GitHub →
      </a>
    </section>
  );
}

export default function Home() {
  return (
    <div className="jmcp-rise mx-auto max-w-6xl px-4 pb-16 pt-14">
      <Hero />
      <ByocBar />
      <ToolsSection />
      <ClientsSection />
      <ConnectSection />
      <CtaSection />
    </div>
  );
}
