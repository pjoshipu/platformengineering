import { spawn } from "node:child_process";
import type { Plugin } from "vite";

/**
 * DEV-ONLY bridge that lets the portal run its agents through the local Claude
 * CLI instead of the Anthropic API. It handles `POST /api/claude` on the Vite
 * dev server, shelling out to `claude -p` (which uses your logged-in Claude
 * subscription — no API key needed), and returns the reply in the OpenAI chat
 * shape the frontend already reads. So `VITE_OPENAI_PROXY_URL=/api/claude`
 * works in BOTH places: locally → this CLI bridge, on Vercel → api/claude.ts.
 *
 * This does not run on the deployed site — Vercel has no CLI and no login, and
 * a public site can't reach your localhost. It's a local-dev alternative only.
 */
export function claudeCliBridge(): Plugin {
  return {
    name: "claude-cli-bridge",
    apply: "serve", // dev server only; never in `vite build`
    configureServer(server) {
      server.middlewares.use("/api/claude", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        let raw = "";
        req.on("data", (chunk) => (raw += chunk));
        req.on("end", () => {
          let messages: { role: string; content: string }[] = [];
          try {
            messages = JSON.parse(raw || "{}").messages ?? [];
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
            return;
          }

          // The frontend packs the persona preamble + generated prompt into the
          // user turn(s); lift any system turns to --append-system-prompt.
          const system = messages
            .filter((m) => m.role === "system")
            .map((m) => m.content)
            .join("\n\n");
          const prompt = messages
            .filter((m) => m.role !== "system")
            .map((m) => m.content)
            .join("\n\n");

          const args = ["-p", "--output-format", "json"];
          if (system) args.push("--append-system-prompt", system);
          if (process.env.ANTHROPIC_MODEL) args.push("--model", process.env.ANTHROPIC_MODEL);

          // `claude` is a shell shim on Windows, so run through the shell.
          const proc = spawn("claude", args, { shell: true });
          let out = "";
          let err = "";
          proc.stdout.on("data", (d) => (out += d));
          proc.stderr.on("data", (d) => (err += d));
          proc.on("error", (e) => {
            res.statusCode = 502;
            res.end(JSON.stringify({ error: `Failed to launch claude CLI: ${e.message}` }));
          });
          proc.on("close", (code) => {
            if (code !== 0) {
              res.statusCode = 502;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ error: err.trim() || `claude exited with code ${code}` }));
              return;
            }
            // --output-format json → { type, result: "<text>", ... }; fall back to raw.
            let text = out;
            try {
              const parsed = JSON.parse(out);
              text = parsed.result ?? text;
            } catch {
              /* plain-text output, use as-is */
            }
            res.setHeader("content-type", "application/json");
            res.end(
              JSON.stringify({
                choices: [
                  { index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" },
                ],
              })
            );
          });

          proc.stdin.write(prompt);
          proc.stdin.end();
        });
      });
    },
  };
}
