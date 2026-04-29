import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

export const runtime = "edge";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const allowedModels = new Set(["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"]);

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "OPENAI_API_KEY is not configured. Add it in .env.local or Vercel to enable streaming AI responses."
    );
  }

  const body = (await request.json()) as {
    messages?: ChatMessage[];
    systemPrompt?: string;
    model?: string;
  };

  const messages = body.messages ?? [];
  const model = allowedModels.has(body.model ?? "") ? body.model! : "gpt-4o-mini";

  const result = streamText({
    model: openai(model),
    system:
      body.systemPrompt?.trim() ||
      "You are a concise, practical assistant for startup operators and software builders.",
    messages
  });

  return result.toTextStreamResponse();
}
