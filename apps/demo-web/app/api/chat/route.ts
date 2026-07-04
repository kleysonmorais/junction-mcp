import { anthropic } from "@ai-sdk/anthropic";
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type LanguageModel,
  type UIMessage,
} from "ai";

export const maxDuration = 120;

// Provider-agnostic agent layer (Vercel AI SDK). We pick a vendor from the
// configured env: LLM_PROVIDER wins if set, otherwise we infer from whichever
// API key is present (Anthropic preferred when both are). CHAT_MODEL overrides
// the per-provider default model.
type Provider = "anthropic" | "openai";

const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-opus-4-8",
  openai: "gpt-4o",
};

function resolveProvider(): Provider | null {
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "anthropic" || explicit === "openai") return explicit;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function resolveModel(provider: Provider): LanguageModel {
  const model = process.env.CHAT_MODEL ?? DEFAULT_MODELS[provider];
  return provider === "openai" ? openai(model) : anthropic(model);
}

const SYSTEM_PROMPT = `You are a health-data assistant for junction-mcp, an MCP server over the Junction API (wearables + lab testing). You answer questions about users, their wearable data, and their lab orders by calling the MCP tools.

Guidance:
- Start with list_users when you need to find a user — client_user_id values like 'mcp_device_multi' or 'mcp_device_freestyle' identify users.
- Wearable questions: use get_wearable_summary for daily/session aggregates (sleep, activity, workouts, body) and get_wearable_timeseries for intraday metrics (glucose, heartrate, hrv...). Devices have ~30 days of history; keep date ranges tight.
- Lab questions: list_lab_orders to survey orders and statuses; get_lab_results for marker-level results on completed orders. Flag abnormal/critical interpretations clearly.
- Today's date is {{TODAY}}.
- Note you are not giving medical advice.
- Be concise and concrete: cite actual numbers, units, and dates from tool results.`;

export async function POST(req: Request): Promise<Response> {
  const provider = resolveProvider();
  if (!provider) {
    return Response.json(
      {
        error:
          "Agent Chat is not configured: set ANTHROPIC_API_KEY or OPENAI_API_KEY " +
          "on the server. The Tool Explorer tab works without it.",
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
      model: resolveModel(provider),
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
