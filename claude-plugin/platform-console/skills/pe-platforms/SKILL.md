---
name: pe-platforms
description: The specialist + foundational platform layer the orchestrator routes to — Application, Data, AI, Agentic (specialist) and Infrastructure (Foundational). Defines each platform's connector (the real system it stubs + dummy data it returns), the cross-layer call protocol with a fixed announcement format so every hop is visible, the self-service / low-infra-dependency mode, the FedEx CLI output format, the Agentic Platform's plan→act→observe flow, and the "what am I being served" transparency rule. Use this skill from /orchestrate and /platforms whenever a request is served by, or hops between, platforms.
---

# Platform Engineering — specialist & foundational platforms

This is the layer **below** the Orchestrator (`pe-orchestration`): the platforms that actually
"provision the capabilities they own" in the reference architecture (`claude-plugin/ARCHITECTURE.md`).

> **Nothing here calls a real external system.** Each platform has a **connector** that names the
> real system it *would* call and returns **dummy data** marked `[STUB]`. This is a teaching demo.

## The platforms

| Platform | Layer | Connector file | Stubs (real systems) |
|---|---|---|---|
| **Application** | Specialist | `connectors/application-platform.md` | CI/CD, deploy, runtime |
| **Data** | Specialist | `connectors/data-platform.md` | BigQuery / Snowflake / GCS |
| **AI** | Specialist | `connectors/ai-platform.md` | model gateway / Vertex AI / vector store |
| **Agentic** | Specialist | `connectors/agentic-platform.md` | agent runtime / registry (Claude Agent SDK, LangGraph) |
| **Infrastructure** | Foundational | `connectors/infra-platform.md` | Identity, Policy, Observability, compute |

Upstream dependencies: **AI → Data, Infra**; **Data → Infra**; **Application → Infra**;
**Agentic → any (dynamic)**; **Infrastructure → (none, it's the base)**.

The **Agentic Platform** extends the diagram's `…` (it is not drawn in `ss.jpg`) and uses a
different flow — see "Agentic flow" below.

## Rule 1 — Always say what you're serving ("what am I being served")

Whenever a platform serves a request, state it plainly before the result:

```
▶ Serving via **Data Platform**  ·  connector stubs: BigQuery  ·  [STUB] dummy data
```

Name the platform and the real system its connector stands in for, and flag that the data is a
stub. The user must never wonder which platform answered.

## Rule 2 — Announce every cross-layer call (fixed format)

When a platform needs a capability another layer owns, **print the hop before fetching it**, using
exactly this format:

```
🔌 <Source> Platform → <Target> Platform  for: <capability>  — <why>
   ↳ [STUB] <one-line dummy result>
```

Example chain for "train a churn model":

```
▶ Serving via **AI Platform**  ·  connector stubs: Vertex AI  ·  [STUB]
🔌 AI Platform → Data Platform  for: training dataset (customer_churn_v3)  — model needs features
   ↳ [STUB] 1.2M rows, 38 features, last refreshed 2026-06-24
🔌 Data Platform → Infrastructure Platform  for: BigQuery slots  — query needs compute
   ↳ [STUB] 500 slots granted, project pe-demo-data
🔌 AI Platform → Infrastructure Platform  for: GPU quota  — training run  — model needs accelerators
   ↳ [STUB] 4× A100 available in us-central1
```

Pull each `↳` result from the **target** platform's connector `Dummy response` block. Never invent
a real API call.

## Rule 3 — Self-service mode (lower dependency on the infra team)

The AI (and any specialist) platform supports **self-service mode**: satisfy the request from the
**Infrastructure platform's paved-road defaults** instead of a deep, custom infra request — so the
product team does *not* have to engage the infra team. When self-service mode is on:

- Use the connector's `Self-service default` values instead of a bespoke Infra hop.
- Announce the avoided dependency, e.g.:

```
🟢 Self-service: AI Platform used paved-road defaults (shared GPU pool) — no Infra-team request needed.
```

- If the request genuinely cannot be met by defaults (e.g. needs a quota above the paved-road cap),
  say so and fall back to the normal cross-layer Infra hop, noting why the escape from self-service
  was required.

Default mode is **self-service ON** for the AI platform (the whole point is lower infra dependency);
turn it off when the user asks for a full/deep infra path.

## Output format — FedEx brand (CLI demo)

**Every** platform capability renders its terminal output in the FedEx-branded format below, so the
whole platform looks consistent. A terminal can't load fonts (and FedEx Sans is proprietary and
**not** bundled), so the brand is carried by a fixed banner, purple/orange accent marks, and
structure — not typography.

**Terminal-safe brand marks:**
- 🟣 purple = headers / primary (the "Fed" of the wordmark)
- 🟠 orange = key values, decisions, accents (the "Ex" of the wordmark)

**Template (apply to all of Application / Data / AI / Infrastructure):**

```
🟣🟠 ─── Fed·Ex · Platform Engineering ─────────────────────────────
🟣 <CAPABILITY TITLE>

▶ Serving via <Platform> · stubs <system> · [STUB]
🔌 <Source> → <Target>  for: <capability> — <why>
   ↳ [STUB] <result>
🟠 <key decision / headline value>

🟣 Result
| field | value |
| …     | …     |

🟣 Observability · platforms: <A → B → C> · self-service: <on/off>
──────────────────────────────────────────── Powered by Fed·Ex PE · [STUB] ───
```

Keep accent marks purposeful (a header 🟣, a decision/headline 🟠) — don't pepper every line. The
serving line (Rule 1), hop lines (Rule 2), and self-service line (Rule 3) stay exactly as defined;
this just wraps them in the FedEx banner + footer and adds the two accent colors.

## Agentic flow (the Agentic Platform's variant)

The other four platforms serve **one capability with hops known up front**. The Agentic Platform is
different: it takes a **goal** and runs a **plan → act → observe loop**, deciding its cross-layer
calls *at runtime*. When serving via the Agentic Platform:

1. Print the serving line, then **iterate visibly** — for each step print
   `step N · decision · 🔌 hop → <Platform> for: <capability>` and the `[STUB]` result.
2. Enforce **autonomy controls** from its connector: `max_steps` + `budget_usd` caps (halt with
   partial results if exceeded), **tool-scope** (only the platforms in the agent's registry entry),
   and **HITL checkpoints** before any high-impact/mutating sub-call.
3. **Recursive governance:** every sub-call still obeys Rules 1–3 (announce hop, honor self-service,
   get audited) and the escape-hatch policy — autonomy does not bypass controls.
4. End with the answer + a trace summary (steps used, budget used, HITL checkpoints, platforms
   engaged).

Keep it distinct from the **Orchestrator Layer** (`/orchestrate`): that is the governed front door
running *fixed business-rule* workflows; the Agentic Platform is a specialist platform doing
*dynamic* planning, and is itself invoked through the orchestrator.

## How connectors and subagents relate

- **Inline (default):** the orchestrator *becomes* each platform, reading its connector file and
  narrating Rules 1–3 directly in the conversation. Best visibility.
- **Subagent (isolated):** each platform also exists as a subagent in `agents/<platform>-platform.md`.
  Those subagents are instructed to emit the same Rule 1–3 lines in their returned output, so hops
  stay visible even when dispatched in isolation.
