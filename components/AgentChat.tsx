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
        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-400 hover:text-zinc-200"
      >
        <span className={done ? "text-emerald-400" : "animate-pulse text-amber-400"}>
          {done ? "✓" : "●"}
        </span>
        {name}
        <span className="text-zinc-600">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-1 max-h-64 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
          <div className="mb-1 text-zinc-600">input</div>
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(part.input, null, 2)}
          </pre>
          {part.output !== undefined && (
            <>
              <div className="mb-1 mt-3 text-zinc-600">output</div>
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
    <div className="flex flex-col gap-4">
      {/* Scenario cards */}
      {messages.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.title}
              onClick={() => submit(s.prompt)}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:border-emerald-800 hover:bg-zinc-900"
            >
              <div className="mb-1 text-lg">{s.emoji}</div>
              <div className="text-sm font-medium text-zinc-100">{s.title}</div>
              <div className="mt-1 text-xs text-zinc-500">{s.tagline}</div>
            </button>
          ))}
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              {message.role === "user" ? "You" : "Agent"}
            </div>
            <div
              className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-emerald-950/40 text-zinc-200 ring-1 ring-emerald-900"
                  : "bg-zinc-900/50 text-zinc-300 ring-1 ring-zinc-800"
              }`}
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
          <div className="animate-pulse text-sm text-zinc-500">
            Agent is working…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
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
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about wearable data or lab orders…"
          className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
