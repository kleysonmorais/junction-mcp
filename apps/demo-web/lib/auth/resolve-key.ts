/**
 * Junction API key resolution for the two HTTP MCP endpoints.
 *
 * /mcp      → caller supplies their own key per request (Authorization header)
 * /mcp-demo → server's default sandbox key from env, never exposed to callers
 */

// Junction keys look like sk_us_* / sk_eu_* (sandbox) or pk_* (production).
// Validate shape before ever forwarding a credential upstream.
const KEY_PATTERN = /^[sp]k_[a-z]{2}_[A-Za-z0-9_-]{8,}$/;

function unauthorized(message: string): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

/**
 * Extract and validate the caller's Junction key from the request.
 * Accepts `Authorization: Bearer <key>` (preferred) or `x-vital-api-key`,
 * mirroring Junction's own auth. Returns a friendly 401 Response when the
 * key is missing or malformed — garbage is never forwarded to Junction.
 */
export function resolveCallerKey(req: Request): string | Response {
  const auth = req.headers.get("authorization");
  const headerKey = req.headers.get("x-vital-api-key");

  let key: string | undefined;
  if (auth) {
    const [scheme, ...rest] = auth.split(" ");
    if (scheme.toLowerCase() !== "bearer" || rest.length !== 1) {
      return unauthorized(
        "Malformed Authorization header. Use: Authorization: Bearer <your Junction sandbox API key>.",
      );
    }
    key = rest[0];
  } else if (headerKey) {
    key = headerKey;
  }

  if (!key) {
    return unauthorized(
      "Missing Junction API key. This endpoint is bring-your-own-key: send your sandbox key as " +
        "'Authorization: Bearer sk_us_...' (or an 'x-vital-api-key' header). " +
        "No key yet? Create a free sandbox team at https://app.junction.com — or try the zero-setup demo endpoint at /mcp-demo.",
    );
  }

  if (!KEY_PATTERN.test(key)) {
    return unauthorized(
      "The supplied Junction API key doesn't look valid (expected a key like sk_us_...). " +
        "Check for truncation or extra whitespace.",
    );
  }

  return key;
}

/** Resolve the server-side demo key. Returns a 500 Response when unconfigured. */
export function resolveDemoKey(): string | Response {
  const key = process.env.JUNCTION_API_KEY;
  if (!key) {
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32002,
          message:
            "Demo endpoint not configured: the JUNCTION_API_KEY environment variable is unset on the server. " +
            "Deployers: set it to a Junction sandbox key. Alternatively use /mcp with your own key.",
        },
        id: null,
      },
      { status: 500 },
    );
  }
  return key;
}
