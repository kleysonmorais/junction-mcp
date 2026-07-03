import { anthropic } from "@ai-sdk/anthropic";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a health-data assistant demoing junction-mcp, an MCP server over the Junction sandbox API (wearables + lab testing). You answer questions about the sandbox's synthetic users, their wearable data, and their lab orders by calling the MCP tools.

Guidance:
- Start with list_users when you need to find a user — client_user_id values like 'mcp_device_multi' or 'mcp_device_freestyle' identify the demo personas.
- Wearable questions: use get_wearable_summary for daily/session aggregates (sleep, activity, workouts, body) and get_wearable_timeseries for intraday metrics (glucose, heartrate, hrv...). Demo devices have ~30 days of history; keep date ranges tight.
- Lab questions: list_lab_orders to survey orders and statuses; get_lab_results for marker-level results on completed orders. Flag abnormal/critical interpretations clearly.
- Today's date is {{TODAY}}.
- All data is synthetic sandbox data — you may discuss it freely, but note you are not giving medical advice.
- Be concise and concrete: cite actual numbers, units, and dates from tool results.`;

export async function POST(req: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Agent Chat is not configured: ANTHROPIC_API_KEY is unset on the server. " +
          "The Tool Explorer tab works without it.",
      },
      { status: 500 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  // The agent consumes the MCP server the same way any external client would:
  // over Streamable HTTP against /mcp-demo (default sandbox key, server-side).
  const origin = new URL(req.url).origin;
  const mcpClient = await createMCPClient({
    transport: new StreamableHTTPClientTransport(new URL("/mcp-demo", origin)),
  });

  try {
    const tools = await mcpClient.tools();

    const result = streamText({
      // Provider-agnostic agent layer: swap this one line to change LLM vendor.
      model: anthropic(process.env.CHAT_MODEL ?? "claude-opus-4-8"),
      system: SYSTEM_PROMPT.replace("{{TODAY}}", new Date().toISOString().slice(0, 10)),
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(12),
      onFinish: async () => {
        await mcpClient.close();
      },
      onError: async () => {
        await mcpClient.close();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    await mcpClient.close();
    throw err;
  }
}
