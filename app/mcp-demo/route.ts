import { createMcpHandler } from "mcp-handler";
import { resolveDemoKey } from "@/lib/auth/resolve-key";
import { registerJunctionTools, SERVER_INFO } from "@/lib/mcp/server";
import { validateOrigin } from "@/lib/security/origin";

/**
 * /mcp-demo — zero-setup demo endpoint. Same tools as /mcp, but authenticated
 * with the deployment's default sandbox key (JUNCTION_API_KEY env var, read
 * server-side only — never sent to the browser). Powers the Tool Explorer UI
 * and /api/chat. Streamable HTTP, stateless.
 */
async function handle(req: Request): Promise<Response> {
  const originError = validateOrigin(req);
  if (originError) return originError;

  const keyOrError = resolveDemoKey();
  if (keyOrError instanceof Response) return keyOrError;

  const handler = createMcpHandler(
    (server) => registerJunctionTools(server, keyOrError),
    { serverInfo: SERVER_INFO },
    { streamableHttpEndpoint: "/mcp-demo", disableSse: true, maxDuration: 60 },
  );
  return handler(req);
}

export { handle as GET, handle as POST, handle as DELETE };
export const maxDuration = 60;
