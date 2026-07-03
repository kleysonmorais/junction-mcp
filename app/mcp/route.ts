import { createMcpHandler } from "mcp-handler";
import { resolveCallerKey } from "@/lib/auth/resolve-key";
import { registerJunctionTools, SERVER_INFO } from "@/lib/mcp/server";
import { validateOrigin } from "@/lib/security/origin";

/**
 * /mcp — the "real" MCP endpoint. Bring your own Junction sandbox key via
 * `Authorization: Bearer <key>`. Streamable HTTP, stateless: every request is
 * self-contained, so the handler is created per request with the caller's key
 * bound into the tool set. No session state exists to hijack.
 */
async function handle(req: Request): Promise<Response> {
  const originError = validateOrigin(req);
  if (originError) return originError;

  const keyOrError = resolveCallerKey(req);
  if (keyOrError instanceof Response) return keyOrError;

  const handler = createMcpHandler(
    (server) => registerJunctionTools(server, keyOrError),
    { serverInfo: SERVER_INFO },
    { streamableHttpEndpoint: "/mcp", disableSse: true, maxDuration: 60 },
  );
  return handler(req);
}

export { handle as GET, handle as POST, handle as DELETE };
export const maxDuration = 60;
