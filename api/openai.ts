import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless proxy for OpenAI chat completions.
 *
 * The browser POSTs the same body it would send to OpenAI (model, max_tokens,
 * messages). We forward it to OpenAI with a SERVER-SIDE key so the key is never
 * shipped in the client bundle and the call is same-origin (no CORS). The
 * upstream response is returned verbatim, so DemoRunner's existing
 * `choices[0].message.content` parsing is unchanged.
 *
 * Configure in Vercel project env: OPENAI_API_KEY (server-only).
 * Point the frontend at this function with VITE_OPENAI_PROXY_URL=/api/openai.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server" });
    return;
  }

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // req.body is already parsed JSON on Vercel; forward it as-is.
      body: JSON.stringify(req.body ?? {}),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(502).json({
      error: "Upstream request to OpenAI failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
