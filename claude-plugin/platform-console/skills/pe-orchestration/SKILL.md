---
name: pe-orchestration
description: Orchestration business rules for the Platform Engineering console — the specialist-platform taxonomy, the named multi-agent workflows (ship a release, handle an incident, onboard a hire) with their step order and context hand-off, the foundational-pillar checks, and the escape-hatch policy. Use this skill whenever running /orchestrate to decide whether to route to one specialist or run a workflow, and in what order to call the agents.
---

# Platform Engineering — orchestration business rules

This is the **Orchestrator Layer** of the reference architecture (see
`claude-plugin/ARCHITECTURE.md`). It fulfils a product team's request by calling the required
specialist platforms **in business-rule order** so each platform provisions the capability it
owns. The per-agent prompts themselves live in the `pe-prompts` skill — this skill only decides
*which* agents run and *in what order*.

## Specialist platform families

Each agent belongs to a specialist platform family and loads its prompt from
`${CLAUDE_PLUGIN_ROOT}/skills/pe-prompts/templates/`.

| Family | Agents (command → template) |
|---|---|
| **Application** | `/diagnostic` → `workflow-diagnostic.md`, `/release` → `release-readiness.md`, `/flags` → `feature-flag-lifecycle.md`, `/incident` → `incident-response.md` |
| **Data** | `/cost` → `cost-optimization.md` (+ the `pe-connect-gcp` sub-flow) |
| **AI / Developer Experience** | `/copilot` → `developer-portal.md`, `/on-board` → `developer-onboarding.md` (+ `pe-personas`) |
| **Security** | `/security` → `security-posture.md` |

## Two modes

1. **Single-agent (smart router)** — the request clearly maps to one capability. Route to that one
   agent and run it exactly as its own command would (load template, gather inputs, report).
2. **Workflow (multi-agent)** — the request matches a named goal below. Run the agents in the
   listed order, **carrying each step's key findings into the next step's inputs**, then give one
   consolidated summary at the end.

When unsure which mode applies, ask the user with `AskUserQuestion` rather than guessing.

## Named workflows (business-rule order)

### Ship a release
**Trigger words:** ship, release, cut, deploy, go-live, promote to prod.
**Order:**
1. `/diagnostic` — **only if** the user mentions recent/failing pipelines. Surfaces the root cause
   of any recent failure. Skip if the pipeline is already green.
2. `/security` — CVE triage, secret scan, IaC drift for the release.
3. `/release` — the quality gate. **Consume** the diagnostic + security findings as inputs and
   render the RELEASE / HOLD / ROLLBACK decision.
**Hand-off:** pass diagnostic's failure summary and security's open-risk count into `/release` so
the gate reflects them.

### Handle an incident
**Trigger words:** incident, outage, down, P1/P2, paging, broke in prod.
**Order:**
1. `/incident` — classify P1–P4, immediate actions, ServiceNow pre-fill.
2. `/diagnostic` — root-cause the failing pipeline/change behind it.
3. `/security` — **only if** a breach, leaked secret, or exploit is suspected.
**Hand-off:** pass the incident's affected service + suspected change into `/diagnostic`.

### Onboard a hire
**Trigger words:** onboard, new hire, joiner, set up access for.
**Order:**
1. `/on-board` — persona-tailored onboarding plan (uses `pe-personas`).
2. `pe-connect-gcp` — provision cloud/data access for that persona.
**Hand-off:** pass the resolved persona from `/on-board` into `pe-connect-gcp` so it asks the right
cloud questions.

## Serving through platforms (the layer below)

Routing decides *which agent/workflow* runs; the **`pe-platforms`** skill defines *which platform
serves it* and the **cross-layer call protocol**. When running a step, name the serving platform and
narrate any hop to another layer (AI → Data → Infra) using `pe-platforms` Rules 1–3, and honor
**self-service mode** (AI platform stays on paved-road defaults to avoid an infra-team dependency).
Every platform response is `[STUB]` dummy data. Platform → agent mapping:

| Platform | Agents it serves |
|---|---|
| Application | `/diagnostic`, `/release`, `/flags`, `/incident` |
| Data | `/cost`, `pe-connect-gcp` |
| AI / DevEx | `/copilot`, `/on-board` |
| Agentic | open-ended, multi-step goals (dynamic *agentic flow*, not a fixed agent) |
| Security | `/security` (uses Infra foundational checks) |

For an open-ended goal that needs runtime planning rather than a fixed workflow, route to the
**Agentic Platform** (`pe-platforms` → "Agentic flow"): it runs a plan→act→observe loop under an
autonomy budget with HITL. It is a specialist platform, distinct from this orchestrator.

## Foundational-pillar checks (apply on every run)

- **Identity** — know who the request is for (persona / role). For onboarding and GCP steps this is
  required; ask if missing.
- **Policy** — follow each agent's prompt guardrails; render a human-readable report by default and
  raw JSON only when the user replies `json`. Confirm a multi-step workflow with `AskUserQuestion`
  before running it.
- **Observability** — at the end of a workflow, list the agents that ran, in order, and their
  headline outcome, so the run is traceable.

## Escape-hatch policy

Running a specialist command directly (e.g. `/security`) **bypasses this orchestrator**. That is a
**governed exception**, allowed in defined cases — but it is the exception, not the default. The
foundational pillars above still apply. The orchestrator should prefer routing through the
appropriate family; only the user explicitly invoking the bare command takes the escape hatch.
