# Platform Console — Reference Architecture

This plugin is a runnable, conversational embodiment of the platform's **Reference Architecture**:
a layered structure that lets product teams reach specialist and foundational platform
functionality through **a single front door**. This doc maps that reference picture (`ss.jpg` in
the repo root) onto the slash commands and skills in `platform-console/`.

## The reference picture

```
┌─────────────────────────────────────────────────────────────┐
│  PORTFOLIO PRODUCT TEAMS                                      │   consumers
│  Specialized applications supporting business functions      │
└─────────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────┐  ┌──────────────┐
│  ENGINEERING PLATFORM INTERFACE  (front    │  │  ESCAPE      │
│  door)                                     │  │  HATCH       │
│   • UI/UX — request & track services       │  │  Governed    │
│   • ORCHESTRATOR LAYER — fulfils a request │  │  direct      │
│     by calling the required platforms in   │  │  access,     │
│     business-rule order                    │  │  controls    │
│   [ … specialist capabilities … ]          │  │  still       │
└───────────────────────────────────────────┘  │  applied     │
┌───────────────────────────────────────────┐  │              │
│  SPECIALIST PLATFORMS                       │  │              │
│   Application   Data   AI   …               │  │              │
└───────────────────────────────────────────┘  └──────────────┘
┌─────────────────────────────────────────────────────────────┐
│  FOUNDATIONAL PLATFORMS                                       │
│   Identity   Policy   Observability   + more pillars          │
└─────────────────────────────────────────────────────────────┘
```

## How each layer maps onto the plugin

| Reference layer | Plugin realization |
|---|---|
| **Portfolio Product Teams** | The engineer running slash commands in Claude Code. |
| **Interface → UI/UX** | The slash-command surface itself; `/admin` is the catalog menu that lets you browse and launch agents. |
| **Interface → Orchestrator Layer** | **`/orchestrate`** — the new front door that interprets a free-text goal and either routes to one specialist or runs a multi-agent workflow in business-rule order. |
| **Specialist Platforms** | The 8 agents, grouped into platform families (below). |
| **Foundational Platforms** | Cross-cutting concerns the orchestrator enforces: Identity (`pe-personas`, GCP auth, admin/developer roles), Policy (business-rule ordering, prompt guardrails, escape-hatch governance), Observability (run history, step logging). |
| **Escape Hatch** | Invoking a specialist command directly (e.g. `/security`) bypasses the orchestrator — allowed in defined cases, but flagged, with foundational policy still applied. |

### Portfolio Product Teams
The top layer is the consumer. In this plugin that's you, the engineer, in a Claude Code session.
You never need to know which specialist platform owns a capability — you state a goal at the front
door and the interface routes it.

### Engineering Platform Interface (the single front door)
The reference splits the interface into two responsibilities, and so does the plugin:
- **UI/UX** = `/admin`. It shows the catalog of agents and lets you launch one. It is *navigation*,
  not logic.
- **Orchestrator Layer** = `/orchestrate`. It holds the *logic*: read the request, decide which
  specialist platform(s) own the needed capability, and call them in the correct business-rule
  order, passing context between steps. This is the box the old `/admin` router never implemented.

### Specialist Platforms
The diagram names Application / Data / AI and leaves a `…` for more. The 8 agents group into:

| Family | Agents | Owns |
|---|---|---|
| **Application** | `/diagnostic`, `/release`, `/flags`, `/incident` | the build → ship → run lifecycle |
| **Data** | `/cost` + the `pe-connect-gcp` sub-flow | utilization data, BigQuery/GCS, datasets |
| **AI / Developer Experience** | `/copilot`, `/on-board` | conversational self-service, ramp-up |
| **Security** | `/security` | CVE triage, secret scan, IaC drift |

Each agent "provisions the capabilities it owns" by loading its canonical prompt from the
`pe-prompts` skill and producing its report.

### Foundational Platforms
The pillars every request implicitly depends on:

| Pillar | Enforced by |
|---|---|
| **Identity** | `pe-personas` (who the dev is), the `pe-connect-gcp` auth step, the web app's admin/developer roles. |
| **Policy** | The business-rule ordering in `pe-orchestration`, the per-agent prompt guardrails, the `json`-only-on-request rule, and the escape-hatch governance below. |
| **Observability** | Run history (`demo_runs` / `localStorage` in the web app); the orchestrator summarizing every step it ran. |
| **+ more pillars** | Cost guardrails, etc. — extensible, matching the diagram's "+ more pillars". |

### Escape Hatch
A governed exception: a product team that must hit a specialist or foundational capability
directly can still run the specialist command itself — e.g. `/security` instead of
`/orchestrate ...`. This is **allowed in defined cases**, but it is the exception, not the path of
least resistance: the command notes it is the escape hatch, and foundational policy (Identity,
Policy, Observability) still applies.

## The orchestrator's business-rule workflows

`/orchestrate` runs in two modes. **Single-agent mode** routes a clear request to one specialist.
**Workflow mode** recognizes a goal and sequences several specialists in order, carrying findings
forward. The named workflows (defined in the `pe-orchestration` skill):

| Goal | Business-rule order | Why this order |
|---|---|---|
| **Ship a release** | `/diagnostic` (only if recent pipeline failures) → `/security` → `/release` | Don't gate a release until the pipeline is green and security is clear; `/release` consumes both findings to decide RELEASE / HOLD / ROLLBACK. |
| **Handle an incident** | `/incident` (classify P1–P4) → `/diagnostic` (root cause) → `/security` (only if breach suspected) | Triage first, then find the cause, then check blast radius. |
| **Onboard a hire** | `/on-board` → `pe-connect-gcp` | Build the persona-tailored plan, then provision cloud access for that persona. |

## The platform layer: connectors, cross-layer calls, self-service

Below the orchestrator sit the platforms it routes to, defined in the **`pe-platforms`** skill.
There are five: **Application**, **Data**, **AI**, **Agentic** (specialist) and **Infrastructure**
(foundational). The **Agentic Platform** is not drawn in `ss.jpg` — it extends the diagram's `…`
placeholder for additional specialist platforms (see "Agentic Platform" below).

**Connector stubs (not real integrations).** Each platform has a *connector* file under
`platform-console/skills/pe-platforms/connectors/` naming the real system it would call (e.g. Data
→ BigQuery, AI → Vertex AI) but returning **dummy data** marked `[STUB]`. No live APIs are wired —
this is a teaching demo with a template ready to be pointed at real systems later.

**"What am I being served."** Before any result, the serving platform announces itself and the
system it stubs:
`▶ Serving via **Data Platform** · connector stubs: BigQuery · [STUB] dummy data`.

**Visible cross-layer calls.** When a platform needs a capability another layer owns, it prints the
hop in a fixed format before fetching it:
`🔌 AI Platform → Data Platform for: training dataset — model needs features`.
Dependencies flow **AI → Data → Infrastructure** (and Application → Infrastructure).

**Self-service mode (lower infra-team dependency).** The AI platform defaults to satisfying
requests from the Infrastructure platform's **paved-road defaults** (shared GPU pool, shared BQ
slots) instead of a bespoke infra request — and says so:
`🟢 Self-service: AI Platform used paved-road defaults — no Infra-team request needed`.
It only escalates to a real Infra hop when a request exceeds a paved-road cap.

**Inline or subagent.** Platforms run two ways: the orchestrator narrates them inline (best
visibility), or it dispatches a platform **subagent** (`platform-console/agents/<platform>-platform.md`)
via the Task tool for isolated execution. The subagents emit the same announcement lines, so hops
stay visible either way.

### Agentic Platform (extends the diagram's `…`)

A specialist platform not shown in `ss.jpg`. Where the other four serve a single capability with
hops known up front, the Agentic Platform takes a **goal** and runs a **plan → act → observe loop**,
deciding its cross-layer calls (Data, AI, Infra, Application) **at runtime**. It is governed by an
**autonomy budget** (max steps / $ cap), **tool-permission scoping**, and **human-in-the-loop
checkpoints**, and every sub-call still obeys the cross-layer + self-service + audit rules.

It is *not* the Orchestrator Layer: `/orchestrate` is the governed front door running *fixed*
business-rule workflows; the Agentic Platform is a specialist platform doing *dynamic* planning, and
is itself invoked through the orchestrator. Connector + dummy trace:
`platform-console/skills/pe-platforms/connectors/agentic-platform.md`; subagent:
`platform-console/agents/agentic-platform.md`.

### Worked example (dummy data) — `/orchestrate train a churn model`

```
▶ Serving via **AI Platform** · connector stubs: Vertex AI · [STUB]
🔌 AI Platform → Data Platform  for: training dataset (customer_churn_v3) — model needs features
   ↳ [STUB] 1.2M rows, 38 features, last refreshed 2026-06-24
🔌 Data Platform → Infrastructure Platform  for: BigQuery slots — query needs compute
   ↳ [STUB] 500 slots from shared pool, ticket_required: false
🟢 Self-service: AI Platform used the shared GPU pool (4×A100) — no Infra-team request needed.
✅ Training job train-7c21 submitted · ETA 22 min · model_type xgboost
— Platforms engaged: AI → Data → Infra · self-service: ON
```

Turn self-service off (or request > 8 GPUs) and the AI platform instead announces a real hop:
`🔌 AI Platform → Infrastructure Platform for: dedicated GPU node pool — exceeds paved-road cap`.

## Navigating the architecture from the command line

| You want to… | Run |
|---|---|
| Browse the agent catalog (UI/UX) | `/admin` |
| State a goal and let the platform orchestrate it | `/orchestrate <goal>` |
| See what each platform serves / what it stubs | `/platforms` |
| Use one specialist directly (escape hatch) | `/diagnostic`, `/release`, `/security`, … |

See `README.md` for install and the full command list;
`platform-console/skills/pe-orchestration/SKILL.md` for workflow definitions; and
`platform-console/skills/pe-platforms/SKILL.md` for the platform/connector model.
