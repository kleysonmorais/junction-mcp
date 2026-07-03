"use client";

import { useCallback, useEffect, useState } from "react";
import {
  callTool,
  listTools,
  type McpToolDef,
  type ToolCallResult,
} from "./mcp-browser-client";

export default function ToolExplorer() {
  const [tools, setTools] = useState<McpToolDef[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<McpToolDef | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ToolCallResult | null>(null);
  const [running, setRunning] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

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
  }, []);

  async function invoke() {
    if (!selected) return;
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

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
        Failed to load tools from /mcp-demo: {loadError}
      </div>
    );
  }

  const props = selected?.inputSchema.properties ?? {};
  const required = new Set(selected?.inputSchema.required ?? []);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Tool list */}
      <div className="w-full shrink-0 md:w-64">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Tools · {tools.length}
        </h2>
        <ul className="space-y-1">
          {tools.map((tool) => (
            <li key={tool.name}>
              <button
                onClick={() => selectTool(tool)}
                className={`w-full rounded-md px-3 py-2 text-left font-mono text-sm transition-colors ${
                  selected?.name === tool.name
                    ? "bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-800"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                }`}
              >
                {tool.name}
              </button>
            </li>
          ))}
          {tools.length === 0 && (
            <li className="px-3 py-2 text-sm text-zinc-600">Loading…</li>
          )}
        </ul>
      </div>

      {/* Invocation panel */}
      {selected && (
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-mono text-lg text-emerald-300">{selected.name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              {selected.description}
            </p>
          </div>

          {Object.keys(props).length > 0 && (
            <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              {Object.entries(props).map(([key, schema]) => (
                <label key={key} className="block">
                  <span className="mb-1 flex items-baseline gap-2 text-sm">
                    <span className="font-mono text-zinc-200">{key}</span>
                    {required.has(key) && (
                      <span className="text-xs text-amber-500">required</span>
                    )}
                  </span>
                  {schema.description && (
                    <span className="mb-1.5 block text-xs text-zinc-500">
                      {schema.description}
                    </span>
                  )}
                  {schema.enum ? (
                    <select
                      value={args[key] ?? ""}
                      onChange={(e) => setArgs({ ...args, [key]: e.target.value })}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100"
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
                        schema.type === "number" || schema.type === "integer"
                          ? "number"
                          : "text"
                      }
                      value={args[key] ?? ""}
                      onChange={(e) => setArgs({ ...args, [key]: e.target.value })}
                      placeholder={schema.type === "string" ? "…" : ""}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-700"
                    />
                  )}
                </label>
              ))}
            </div>
          )}

          <button
            onClick={invoke}
            disabled={running}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {running ? "Calling Junction…" : "Invoke tool"}
          </button>

          {callError && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {callError}
            </div>
          )}

          {result && (
            <div
              className={`overflow-x-auto rounded-lg border p-4 text-xs leading-relaxed ${
                result.isError
                  ? "border-red-900 bg-red-950/30 text-red-200"
                  : "border-zinc-800 bg-zinc-950 text-zinc-300"
              }`}
            >
              <pre className="whitespace-pre-wrap break-words font-mono">
                {result.content.map((c) => c.text ?? "").join("\n")}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
