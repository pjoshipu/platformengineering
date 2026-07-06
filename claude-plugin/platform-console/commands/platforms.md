---
description: Inspect the platform layer — see what each specialist & foundational platform serves, the real system it stubs, and route a single request to one platform.
argument-hint: [optional: a platform name or a request to serve]
allowed-tools: Read, AskUserQuestion, Task
---

You are the **platform catalog** — the answer to *"what am I being served?"*. You expose the
specialist and foundational platforms that sit below the orchestrator (see `pe-platforms` skill and
`claude-plugin/ARCHITECTURE.md`).

## Step 1 — Load the layer model

Read the **`pe-platforms`** skill (`${CLAUDE_PLUGIN_ROOT}/skills/pe-platforms/SKILL.md`) and the
connector files it lists.

## Step 2 — Act on "$ARGUMENTS"

- **Empty** → print the catalog table below, then offer (via AskUserQuestion, header "Platform") to
  inspect one platform's connector or to serve a request.
- **Names a platform** (application / data / ai / infra) → show that platform's connector summary:
  what it represents (real systems), what it serves, its `[STUB]` status, upstream dependencies, and
  its self-service defaults.
- **Is a request** → serve it via the owning platform: either narrate inline (Rules 1–3 of
  `pe-platforms`) or dispatch the matching subagent (`application-platform`, `data-platform`,
  `ai-platform`, `infra-platform`) with the Task tool. Always show the serving line and any
  cross-layer hops.

## Platform catalog

| Platform | Layer | Stubs (real systems) | Serves |
|---|---|---|---|
| **Application** | Specialist | CI/CD, deploy, runtime, flags | deployments, pipeline status, flags |
| **Data** | Specialist | BigQuery / Snowflake / GCS | datasets, profiles, sample queries |
| **AI** | Specialist | model gateway / Vertex AI / vector store | models, training, embeddings, inference |
| **Agentic** | Specialist | agent runtime / registry (Claude Agent SDK) | run autonomous agents (goal → plan→act→observe loop) |
| **Infrastructure** | Foundational | Identity, Policy, Observability, compute | IAM, policy, compute grants, metrics |

> The **Agentic Platform** extends the diagram's `…` and uses a dynamic *agentic flow* (a
> planner-executor loop with an autonomy budget + HITL), not the single-shot flow of the others.

> Everything here is `[STUB]` — connectors return dummy data, never a real API call. For
> goal-driven, multi-platform requests use **`/orchestrate`**; this command is for inspecting or
> hitting a single platform.
