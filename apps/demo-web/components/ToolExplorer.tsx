"use client";

import { useCallback, useEffect, useState } from "react";
import {
  callTool,
  listTools,
  type McpToolDef,
  type ToolCallResult,
} from "./mcp-browser-client";
import { JsonView } from "./JsonView";

export default function ToolExplorer() {
  const [tools, setTools] = useState<McpToolDef[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<McpToolDef | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ToolCallResult | null>(null);
  const [running, setRunning] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    listTools()
      .then((t) => {
        setTools(t);
        setSelected(t[0] ?? null);
      })
      .catch((e) => setLoadError(String(e)));
  }, []);

  const selectTool = useCallback((tool: McpToolDef) => {
    setSelected(tool);
    setArgs({});
    setResult(null);
    setCallError(null);
    setMissingFields(new Set());
  }, []);

  async function invoke() {
    if (!selected) return;

    const required = selected.inputSchema.required ?? [];
    const missing = new Set(
      required.filter((key) => !args[key] || args[key].trim() === ""),
    );
    setMissingFields(missing);
    if (missing.size > 0) {
      setCallError("Please fill in all required fields.");
      return;
    }

    setRunning(true);
    setResult(null);
    setCallError(null);
    try {
      const props = selected.inputSchema.properties ?? {};
      const parsed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (value === "") continue;
        const schema = props[key];
        parsed[key] =
          schema?.type === "number" || schema?.type === "integer"
            ? Number(value)
            : value;
      }
      setResult(await callTool(selected.name, parsed));
    } catch (e) {
      setCallError(String(e));
    } finally {
      setRunning(false);
    }
  }

  const errorBox = {
    borderColor: "var(--accent-line)",
    background: "var(--accent-soft)",
    color: "var(--accent-text)",
  } as const;

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-10">
        <div className="rounded-xl border p-4 text-sm" style={errorBox}>
          Failed to load tools from the sandbox: {loadError}
        </div>
      </div>
    );
  }

  const props = selected?.inputSchema.properties ?? {};
  const required = new Set(selected?.inputSchema.required ?? []);

  const inputStyle = {
    borderColor: "var(--line)",
    background: "var(--panel2)",
    color: "var(--ink)",
  } as const;

  const invalidInputStyle = {
    ...inputStyle,
    borderColor: "var(--accent-line)",
  } as const;

  function updateArg(key: string, value: string) {
    setArgs((prev) => ({ ...prev, [key]: value }));
    setMissingFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  return (
    <div className="jmcp-rise mx-auto max-w-5xl px-4 pb-16 pt-10">
      <header className="mb-6">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          Tool Explorer
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--sub)" }}>
          Invoke the raw MCP tools directly against the sandbox.
        </p>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Tool list */}
        <div className="w-full shrink-0 md:w-64">
          <h2
            className="mb-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--faint)" }}
          >
            Tools · {tools.length}
          </h2>
          <ul className="space-y-1">
            {tools.map((tool) => {
              const active = selected?.name === tool.name;
              return (
                <li key={tool.name}>
                  <button
                    onClick={() => selectTool(tool)}
                    className="w-full rounded-lg px-3 py-2 text-left font-mono text-sm transition-colors"
                    style={{
                      background: active ? "var(--accent-soft)" : "transparent",
                      color: active ? "var(--accent-text)" : "var(--sub)",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {tool.title ?? tool.name}
                  </button>
                </li>
              );
            })}
            {tools.length === 0 && (
              <li
                className="px-3 py-2 text-sm"
                style={{ color: "var(--faint)" }}
              >
                Loading…
              </li>
            )}
          </ul>
        </div>

        {/* Invocation panel */}
        {selected && (
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2
                className="font-mono text-lg"
                style={{ color: "var(--accent-text)" }}
              >
                {selected.title}
              </h2>
              <p
                className="mt-1 text-sm leading-relaxed"
                style={{ color: "var(--sub)" }}
              >
                {selected.description}
              </p>
            </div>

            {Object.keys(props).length > 0 && (
              <div
                className="space-y-3 rounded-xl border p-4"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--panel)",
                }}
              >
                {Object.entries(props).map(([key, schema]) => {
                  const invalid = missingFields.has(key);
                  return (
                    <label key={key} className="block">
                      <span className="mb-1 flex items-baseline gap-2 text-sm">
                        <span
                          className="font-mono"
                          style={{ color: "var(--ink)" }}
                        >
                          {key}
                        </span>
                        {required.has(key) && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--accent-text)" }}
                          >
                            required
                          </span>
                        )}
                      </span>
                      {schema.description && (
                        <span
                          className="mb-1.5 block text-xs"
                          style={{ color: "var(--faint)" }}
                        >
                          {schema.description}
                        </span>
                      )}
                      {schema.enum ? (
                        <select
                          value={args[key] ?? ""}
                          onChange={(e) => updateArg(key, e.target.value)}
                          className="w-full rounded-lg border px-3 py-1.5 text-sm"
                          style={invalid ? invalidInputStyle : inputStyle}
                        >
                          <option value="">— select —</option>
                          {schema.enum.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            schema.type === "number" ||
                            schema.type === "integer"
                              ? "number"
                              : "text"
                          }
                          value={args[key] ?? ""}
                          onChange={(e) => updateArg(key, e.target.value)}
                          placeholder={schema.type === "string" ? "…" : ""}
                          className="w-full rounded-lg border px-3 py-1.5 font-mono text-sm"
                          style={invalid ? invalidInputStyle : inputStyle}
                        />
                      )}
                      {invalid && (
                        <span
                          className="mt-1 block text-xs"
                          style={{ color: "var(--accent-text)" }}
                        >
                          This field is required.
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            <button
              onClick={invoke}
              disabled={running}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-transform hover:-translate-y-px disabled:opacity-50"
              style={{ background: "var(--btn-bg)", color: "var(--btn-ink)" }}
            >
              {running ? "Calling Junction…" : "Invoke tool"}
            </button>

            {callError && (
              <div className="rounded-xl border p-3 text-sm" style={errorBox}>
                {callError}
              </div>
            )}

            {result && (
              <div
                className="overflow-x-auto rounded-xl border p-4 text-xs leading-relaxed"
                style={
                  result.isError
                    ? errorBox
                    : {
                        borderColor: "var(--line)",
                        background: "var(--code-bg)",
                        color: "var(--code-text)",
                      }
                }
              >
                <JsonView
                  text={result.content.map((c) => c.text ?? "").join("\n")}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
