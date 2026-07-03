/**
 * Origin validation for the MCP endpoints, per the MCP spec's DNS-rebinding
 * guidance: when a browser sends an Origin header, it must be one we trust.
 *
 * Non-browser MCP clients (Claude Desktop, Inspector CLI, server-side agents)
 * send no Origin header and pass through — this guard exists to stop a
 * malicious webpage from driving the endpoint with a visitor's browser.
 */
export function validateOrigin(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = new Set<string>();

  // The deployment's own origin (covers the Tool Explorer UI + localhost dev).
  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    // unparseable request URL — fall through to explicit lists
  }
  const host = req.headers.get("host");
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  for (const extra of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = extra.trim();
    if (trimmed) allowed.add(trimmed.replace(/\/$/, ""));
  }

  let originHost: string;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    return forbidden(origin);
  }
  const isLocalhost = originHost === "localhost" || originHost === "127.0.0.1";

  if (allowed.has(origin) || isLocalhost) return null;
  return forbidden(origin);
}

function forbidden(origin: string): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32003,
        message: `Origin '${origin}' is not allowed to access this MCP endpoint.`,
      },
      id: null,
    },
    { status: 403 },
  );
}
