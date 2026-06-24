# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A teaching demo app for the "Agentic AI in Platform Engineering" course. It showcases ~7 platform-engineering AI agents (onboarding, CI/CD diagnostics, release readiness, feature-flag hygiene, security posture, cost optimization, incident response) through an interactive React UI. The same agents exist in three parallel implementations — keep that in mind before assuming there's one source of truth.

## Commands

```sh
npm install
npm run dev          # Vite dev server on http://localhost:8080
npm run build        # production build to dist/
npm run build:dev    # build in development mode (keeps lovable-tagger)
npm run preview      # serve the built dist/
npm run deploy       # build + publish dist/ to GitHub Pages (gh-pages branch)
```

- **No test runner and no `lint` npm script exist.** `eslint.config.js` is present but ESLint is not wired into `package.json` (and its plugin deps aren't installed). Don't assume `npm test`/`npm run lint` work.
- Python demos: `cd python && pip install -r requirements.txt`, then run an exercise directly, e.g. `python exercises/ex1_diagnostic_agent.py`. Set `USE_MOCK_AI=true` to run with no API key.
- Supabase Edge Functions (optional): `supabase functions serve` locally; `supabase functions deploy <name>` to ship.

## The three implementations (and how they diverge)

Each agent is implemented up to three times. When changing agent behavior, decide which surface(s) you actually need to touch:

1. **React frontend** (`src/`) — what the deployed GitHub Pages site runs. For most agents the browser calls OpenAI **directly** using prompts built inline in `generatePromptForDemo()` in `src/components/DemoRunner.tsx`. For a subset it can instead call a Supabase Edge Function.
2. **Supabase Edge Functions** (`supabase/functions/<name>/index.ts`) — standalone Deno handlers, one per agent, each building its own prompt and calling OpenAI. Used only when Supabase env vars are set.
3. **Python CLI** (`python/exercises/ex*.py` + `python/ai_client.py`) — workshop exercises with a multi-provider client (Anthropic / OpenAI / Mock fallback). Independent of the web app.

The prompts and exact behaviors are **duplicated** across these three, not shared. A fix in one does not propagate to the others.

### Branding caveat (important)

Despite the README, course title, and UI copy all saying "Claude API", **the running code uses OpenAI `gpt-4o-mini`**. In `DemoRunner.tsx`, `CLAUDE_MODEL = "gpt-4o-mini"`; the frontend key is `VITE_OPENAI_API_KEY`; Edge Functions read `OPENAI_API_KEY` and POST to `api.openai.com`. Several prompts even contain instructions like *"Do not mention any AI model names like Gemini."* Treat "Claude" labels in UI/strings as branding, not as the actual provider, unless you are deliberately migrating to the Anthropic API. The Python client (`ai_client.py`) is the only place with real Anthropic support.

## Frontend architecture

- **Entry/routing**: `App.tsx` → `pages/Index.tsx`. Auth is **client-side only** — `contexts/AuthContext.tsx` stores the chosen user (role `admin` or `developer`) in `localStorage`, no backend auth. `Index.tsx` renders `Login`, then `AdminView` or `DeveloperView` based on role. Uses `HashRouter` (required for GitHub Pages); Vite `base` is `/platform/`.
- **Endpoint routing**: `getAgentEndpoint()` in `DemoRunner.tsx` decides per-agent whether to hit a Supabase Edge Function (when `VITE_SUPABASE_URL` is set and the agent id is in its map) or fall back to OpenAI. In dev, OpenAI calls are proxied through Vite's `/openai` → `https://api.openai.com` (see `vite.config.ts`) to avoid CORS.
- **Run history / persistence**: results are saved to a Supabase `demo_runs` table when configured, otherwise to `localStorage` under `demoRuns:<demoId>`. The code degrades gracefully to local storage on any Supabase error.
- **UI components**: `src/components/ui/` is generated shadcn/ui — don't hand-edit these. Import alias `@` → `src` (see `vite.config.ts` / `tsconfig`).

### There are multiple, overlapping agent registries — keep them in sync

Adding or renaming an agent usually means editing several files that each hold their own copy of the agent list:
- `src/config/agents.ts` — `AGENTS` metadata (id, category, endpoint, required inputs).
- `src/components/AdminView.tsx` (and `DeveloperView.tsx`) — an **inline `demos` array** with `pythonFile` labels; this is what the views actually map over.
- `src/components/DemoRunner.tsx` — `getAgentEndpoint()` endpoint map **and** the `generatePromptForDemo()` switch.
- `src/components/DemoRunnerHelpers.tsx` — `getPayloadForDemo()` (default/sample inputs) and `formatDemoOutput()`.
- `src/components/DynamicDemoInputs.tsx` — the input form per agent.
- Optionally `supabase/functions/<name>/index.ts` + a `[functions.<name>]` block in `supabase/config.toml`.

These lists are **not derived from one source** and currently drift: e.g. `supabase/config.toml` still registers the old `workflow-diagnostic`/`multi-agent`/`developer-portal` functions while `supabase/functions/` contains a different newer set, and `agents.ts` lists `security-posture` which has no Edge Function (it falls back to OpenAI). When touching an agent, grep its id across all of the above rather than trusting any single list.

## Environment variables

Frontend (`.env`, `VITE_`-prefixed so they reach the browser):
- `VITE_OPENAI_API_KEY` — required for any live agent run.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — enable the Supabase client (`integrations/supabase/client.ts` returns `null` without them) and Edge Function routing + run history.
- `VITE_OPENAI_PROXY_URL`, `VITE_SUPABASE_FUNCTIONS_BASE_URL` — optional overrides for endpoint routing.

Edge Functions / Python (server-side, not `VITE_`): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (Python only), `USE_MOCK_AI`.
