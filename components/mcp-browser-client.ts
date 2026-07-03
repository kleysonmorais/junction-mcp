/**
 * Minimal browser-side MCP client for the Tool Explorer.
 *
 * The server runs Streamable HTTP in stateless mode, so each JSON-RPC call is
 * a self-contained POST — no initialize handshake or session id required.
 * Responses arrive as JSON or as a short SSE stream; both are handled.
 */

export interface McpToolDef {
  name: string;
  title?: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, JsonSchemaProp>;
    required?: string[];
  };
}

export interface JsonSchemaProp {
  type?: string;
  description?: string;
  enum?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

async function rpc(method: string, params: unknown): Promise<unknown> {
  const id = Date.now();
  const res = await fetch("/mcp-demo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  let message: JsonRpcResponse | undefined;

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    for (const line of text.split("\n")) {
      if (!line.startsWith("data:")) continue;
      try {
        const parsed = JSON.parse(line.slice(5)) as JsonRpcResponse;
        if (parsed.id === id) message = parsed;
      } catch {
        // ignore non-JSON keepalive lines
      }
    }
  } else {
    message = (await res.json()) as JsonRpcResponse;
  }

  if (!message) throw new Error(`Empty MCP response (HTTP ${res.status})`);
  if (message.error) throw new Error(message.error.message);
  return message.result;
}

export async function listTools(): Promise<McpToolDef[]> {
  const result = (await rpc("tools/list", {})) as { tools: McpToolDef[] };
  return result.tools;
}

export interface ToolCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

export function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolCallResult> {
  return rpc("tools/call", { name, arguments: args }) as Promise<ToolCallResult>;
}
