"use client";

import { useState } from "react";
import AgentChat from "@/components/AgentChat";
import ToolExplorer from "@/components/ToolExplorer";

const TABS = ["Agent Chat", "Tool Explorer"] as const;
type Tab = (typeof TABS)[number];

export default function Home() {
  const [tab, setTab] = useState<Tab>("Agent Chat");

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          junction-mcp
          <span className="ml-3 rounded-full border border-emerald-800 bg-emerald-950/50 px-2.5 py-0.5 align-middle text-xs font-normal text-emerald-400">
            sandbox demo
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          An open-source MCP server exposing wearable and lab data from the
          Junction sandbox API to AI agents. Query synthetic patient health
          with natural language, or invoke the MCP tools directly — zero setup.
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Synthetic sandbox data only · not medical advice · MCP endpoint for
          your own client:{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-400">
            POST /mcp
          </code>{" "}
          with{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-400">
            Authorization: Bearer &lt;your junction key&gt;
          </code>
        </p>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === t
                ? "border-emerald-500 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "Agent Chat" ? <AgentChat /> : <ToolExplorer />}

      <footer className="mt-12 border-t border-zinc-900 pt-4 text-xs text-zinc-600">
        MIT licensed · built on the Junction sandbox API · Streamable HTTP MCP
        (stateless)
      </footer>
    </main>
  );
}
