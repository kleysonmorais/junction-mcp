"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { SCENARIOS } from "./scenarios";

interface ToolPartLike {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
}

function ToolCallChip({ part }: { part: ToolPartLike }) {
  const [open, setOpen] = useState(false);
  const name = part.toolName ?? part.type.replace(/^tool-/, "");
  const done = part.state === "output-available" || part.state === "output-error";

  return (
    <div className="my-1">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors"
        style={{
          borderColor: "var(--line)",
          background: "var(--panel2)",
          color: "var(--sub)",
        }}
      >
        <span
          className={done ? "" : "jmcp-pulse"}
          style={{ color: done ? "var(--ok)" : "var(--accent-text)" }}
        >
          {done ? "✓" : "●"}
        </span>
        {name}
        <span style={{ color: "var(--faint)" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div
          className="mt-1 max-h-64 overflow-auto rounded-md border p-3 font-mono text-xs"
          style={{
            borderColor: "var(--line)",
            background: "var(--code-bg)",
            color: "var(--code-text)",
          }}
        >
          <div style={{ color: "var(--code-dim)" }}>input</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(part.input, null, 2)}
          </pre>
          {part.output !== undefined && (
            <>
              <div className="mt-3" style={{ color: "var(--code-dim)" }}>
                output
              </div>
              <pre className="whitespace-pre-wrap break-words">
                {typeof part.output === "string"
                  ? part.output
                  : JSON.stringify(part.output, null, 2).slice(0, 4000)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentChat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  return (
    <div className="jmcp-rise mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-16 pt-10">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
          Agent Chat
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--sub)" }}>
          A real agent loop over <span className="font-mono">/mcp-demo</span> — natural
          language in, real tool calls out.
        </p>
      </header>

      {/* Scenario cards */}
      {messages.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              onClick={() => submit(s.prompt)}
              className="rounded-xl border p-4 text-left transition-transform hover:-translate-y-px"
              style={{
                borderColor: "var(--line)",
                background: "var(--panel)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div className="mb-1 text-lg">{s.emoji}</div>
              <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {s.title}
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--faint)" }}>
                {s.tagline}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className="mb-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--faint)" }}
            >
              {message.role === "user" ? "You" : "Agent"}
            </div>
            <div
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={
                message.role === "user"
                  ? { background: "var(--user-bg)", color: "var(--user-ink)" }
                  : {
                      background: "var(--panel)",
                      color: "var(--ink)",
                      border: "1px solid var(--line)",
                    }
              }
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
                  return <ToolCallChip key={i} part={part as ToolPartLike} />;
                }
                return null;
              })}
            </div>
          </div>
        ))}
        {busy && (
          <div className="jmcp-pulse text-sm" style={{ color: "var(--faint)" }}>
            Agent is working…
          </div>
        )}
        {error && (
          <div
            className="rounded-xl border p-3 text-sm"
            style={{
              borderColor: "var(--accent-line)",
              background: "var(--accent-soft)",
              color: "var(--accent-text)",
            }}
          >
            {error.message}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="sticky bottom-4 flex gap-2 rounded-xl border p-2"
        style={{
          background: "var(--panel)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about wearable data or lab orders…"
          className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          style={{ color: "var(--ink)" }}
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg px-5 py-2 text-sm font-medium transition-transform hover:-translate-y-px disabled:opacity-50"
          style={{ background: "var(--btn-bg)", color: "var(--btn-ink)" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
