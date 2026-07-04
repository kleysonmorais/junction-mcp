"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "./scenarios";
import { JsonView } from "./JsonView";
import { Markdown } from "./Markdown";

function toJsonText(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? null, null, 2);
}

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
  const done =
    part.state === "output-available" || part.state === "output-error";

  return (
    <div className="self-start">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors"
        style={{
          borderColor: "var(--accent-line)",
          background: "var(--accent-soft)",
          color: "var(--accent-text)",
        }}
      >
        <span>→ {name}()</span>
        {done ? (
          <span style={{ color: "var(--faint)" }}>· done</span>
        ) : (
          <span
            className="jmcp-spin inline-block h-[11px] w-[11px] rounded-full border-2"
            style={{
              borderColor: "var(--accent-line)",
              borderTopColor: "var(--accent-text)",
            }}
          />
        )}
        <span style={{ color: "var(--faint)" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div
          className="mt-1.5 max-h-72 overflow-auto rounded-xl border p-4 text-xs leading-relaxed"
          style={{
            borderColor: "var(--line)",
            background: "var(--code-bg)",
            color: "var(--code-text)",
          }}
        >
          <div
            className="mb-1 font-mono text-[10.5px] uppercase tracking-wider"
            style={{ color: "var(--code-dim)" }}
          >
            input
          </div>
          <JsonView text={toJsonText(part.input)} />
          {part.output !== undefined && (
            <>
              <div
                className="mb-1 mt-3 font-mono text-[10.5px] uppercase tracking-wider"
                style={{ color: "var(--code-dim)" }}
              >
                output
              </div>
              <JsonView text={toJsonText(part.output)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentChat() {
  const { messages, sendMessage, setMessages, status, error } = useChat();
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  const empty = messages.length === 0;

  return (
    <div
      className="jmcp-rise mx-auto flex min-h-0 w-full max-w-5xl flex-col px-4 pb-4 pt-10"
      style={{ height: "calc(100dvh - 76px - 68px)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          Agent Chat
        </h1>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
          style={{
            color: "var(--ok)",
            background: "var(--ok-soft)",
            borderColor: "var(--ok-line)",
          }}
        >
          <span
            className="jmcp-pulse inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--ok)" }}
          />
          sandbox
        </span>
        {!empty && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors"
            style={{ color: "var(--faint)", borderColor: "var(--line)" }}
          >
            Clear conversation
          </button>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-0.5 pb-1 pt-3"
      >
        {empty ? (
          <div className="flex min-h-full flex-col items-center justify-center gap-2 py-2 text-center">
            <span
              className="mb-1 grid h-[34px] w-[34px] place-items-center rounded-xl"
              style={{ background: "var(--btn-bg)" }}
            >
              <span
                className="block h-[11px] w-[11px] rounded-full"
                style={{ background: "var(--btn-ink)" }}
              />
            </span>
            <div
              className="text-[17px] font-[650]"
              style={{ color: "var(--ink)" }}
            >
              Ask the sandbox anything.
            </div>

            <div className="mt-3.5 grid w-full grid-cols-2 gap-2.5">
              {SCENARIOS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => submit(s.prompt)}
                  className="rounded-2xl border p-4 text-left transition-transform hover:-translate-y-px"
                  style={{
                    borderColor: "var(--line)",
                    background: "var(--panel)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div
                    className="text-[13.5px] font-[550] leading-[1.4]"
                    style={{ color: "var(--ink)" }}
                  >
                    {s.label}
                  </div>
                  <div
                    className="mt-1 font-mono text-[11px]"
                    style={{ color: "var(--faint)" }}
                  >
                    {s.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            if (message.role === "user") {
              const text = message.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <div
                  key={message.id}
                  className="jmcp-rise my-3.5 flex justify-end"
                >
                  <div
                    className="max-w-[78%] whitespace-pre-wrap border px-4 py-2.5 text-sm leading-[1.55]"
                    style={{
                      background: "var(--user-bg)",
                      color: "var(--user-ink)",
                      borderColor: "var(--accent-line)",
                      borderRadius: "16px 16px 5px 16px",
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message.id}
                className="jmcp-rise my-3.5 flex flex-col items-start gap-2"
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div
                        key={i}
                        className="max-w-[88%] border px-4 py-3"
                        style={{
                          background: "var(--panel)",
                          borderColor: "var(--line)",
                          borderRadius: "16px 16px 16px 5px",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    );
                  }
                  if (
                    part.type === "dynamic-tool" ||
                    part.type.startsWith("tool-")
                  ) {
                    return <ToolCallChip key={i} part={part as ToolPartLike} />;
                  }
                  return null;
                })}
              </div>
            );
          })
        )}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div
            className="jmcp-pulse my-3.5 text-sm"
            style={{ color: "var(--faint)" }}
          >
            Agent is working…
          </div>
        )}
        {error && (
          <div
            className="my-3.5 rounded-xl border p-3 text-sm"
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
        className="mt-3 flex items-center gap-2.5 rounded-2xl border py-2 pl-[18px] pr-2"
        style={{
          background: "var(--panel)",
          borderColor: "var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about users, wearables, or lab results…"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
          style={{ color: "var(--ink)" }}
        />
        {busy ? (
          <span
            className="grid h-[38px] w-[38px] place-items-center rounded-xl"
            style={{ background: "var(--panel2)" }}
          >
            <span
              className="jmcp-spin block h-[13px] w-[13px] rounded-full border-2"
              style={{
                borderColor: "var(--line)",
                borderTopColor: "var(--accent-text)",
              }}
            />
          </span>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            title="Send"
            className="grid h-[38px] w-[38px] place-items-center rounded-xl text-base font-bold transition-transform hover:-translate-y-px disabled:opacity-50"
            style={{ background: "var(--btn-bg)", color: "var(--btn-ink)" }}
          >
            ↑
          </button>
        )}
      </form>
      <div
        className="mx-0.5 mb-3.5 mt-2 text-[11.5px]"
        style={{ color: "var(--faint)" }}
      >
        Live over the sandbox — the agent streams real tool calls server-side.
      </div>
    </div>
  );
}
