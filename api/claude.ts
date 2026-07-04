import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless adapter that connects the IDP portal to Claude.
 *
 * The frontend (DemoRunner) speaks the OpenAI chat-completions shape:
 *   request : { model, max_tokens, messages: [{ role, content }] }
 *   response: { choices: [{ message: { content } }] }
 *
 * This function accepts that request, calls the Anthropic Messages API with a
 * SERVER-SIDE key (never shipped to the browser), and adapts the Anthropic
 * response back into the OpenAI shape — so no frontend code changes are needed.
 * Point the frontend at it with VITE_OPENAI_PROXY_URL=/api/claude.
 *
 * Vercel env: ANTHROPIC_API_KEY (required, server-only),
 *             ANTHROPIC_MODEL (optional, defaults to claude-opus-4-8).
 */

interface OpenAiMessage {
  role: string;
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server" });
    return;
  }

  const body = (req.body ?? {}) as { max_tokens?: number; messages?: OpenAiMessage[] };
  const model = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
  const max_tokens = typeof body.max_tokens === "number" ? body.max_tokens : 2048;

  // The frontend sends OpenAI-style messages; Anthropic uses the same
  // {role, content} shape for user/assistant turns. Any "system" role is lifted
  // to the top-level `system` field (Anthropic doesn't accept system in messages).
  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const system = incoming
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const messages = incoming
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    const data = (await upstream.json()) as {
      content?: { type: string; text?: string }[];
      stop_reason?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
      error?: { message?: string };
    };

    if (!upstream.ok) {
      res.status(upstream.status).json({
        error: data?.error?.message || "Anthropic request failed",
      });
      return;
    }

    // Adapt Anthropic content blocks → OpenAI chat-completion shape.
    const text = (data.content ?? [])
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("");

    res.status(200).json({
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: data.stop_reason ?? "stop",
        },
      ],
      usage: {
        prompt_tokens: data.usage?.input_tokens,
        completion_tokens: data.usage?.output_tokens,
      },
    });
  } catch (err) {
    res.status(502).json({
      error: "Upstream request to Anthropic failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
