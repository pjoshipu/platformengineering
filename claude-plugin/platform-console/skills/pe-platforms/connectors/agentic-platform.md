# Connector — Agentic Platform  `[STUB]`

**Represents (real systems):** an agent runtime / agent registry (e.g. Claude Agent SDK, LangGraph),
a tool/permission broker, and an autonomy-control plane (budgets, traces, human-in-the-loop).
**Status:** `[STUB]` — not wired to a real system; all responses below are dummy data.
**Layer:** Specialist (extends the `…` in the reference diagram — not drawn in `ss.jpg`).
**Upstream dependencies:** **any** platform — AI (models), Data (context), Infrastructure (compute,
identity, policy), Application (deploy/runtime). Calls them **dynamically at runtime**, not in a
fixed order.

> The Agentic Platform is different from the others: instead of serving one fixed capability, it
> runs a **goal → plan → act → observe loop** and decides its own cross-layer calls as it goes.
> It is *not* the Orchestrator Layer (that's the governed front door with fixed business-rule
> workflows); it is a specialist platform that does dynamic, autonomous planning, invoked **through**
> the orchestrator like any other platform.

## Serves (capabilities)

- `agent.list` — registered agents available to product teams
- `agent.run` — run an agent against a goal (returns the decision trace + result)
- `agent.trace` — fetch the step-by-step trace of a run

## Request contract

| Capability | Inputs |
|---|---|
| `agent.list` | — |
| `agent.run` | `goal`, `max_steps` (default 6), `budget_usd` (default 2.00), `hitl` (default `on`) |
| `agent.trace` | `run_id` |

## Dummy response

```json
{
  "agent.list": [
    { "name": "release-copilot", "tools": ["application", "infrastructure"], "autonomy": "supervised" },
    { "name": "data-insights-agent", "tools": ["data", "ai"], "autonomy": "supervised" }
  ],
  "agent.run": {
    "run_id": "agrun-5521",
    "goal": "summarize this week's shipment delays and flag at-risk lanes",
    "status": "completed",
    "steps_used": 4,
    "budget_used_usd": 0.38,
    "hitl_checkpoints": 1,
    "trace": [
      { "step": 1, "decision": "need data", "call": "Data Platform · dataset.profile(shipment_delays)", "result": "3.4M rows, 22 features" },
      { "step": 2, "decision": "need compute for aggregation", "call": "Infrastructure Platform · compute.grant(bq-slots)", "result": "500 slots, ticket_required: false" },
      { "step": 3, "decision": "summarize with model", "call": "AI Platform · inference.run(claude-opus-4-8)", "result": "12 at-risk lanes identified" },
      { "step": 4, "decision": "high-impact action → pause needed", "call": "HITL checkpoint", "result": "human approved publishing summary" }
    ],
    "answer": "12 lanes at risk this week; top driver: weather_idx on MEM→DFW. Recommend re-routing 3 lanes."
  }
}
```

## Autonomy controls (foundational policy applies to every sub-call)

- **Autonomy budget:** capped by `max_steps` and `budget_usd`; the run halts and returns partial
  results if either is exceeded (no runaway loops).
- **Tool/permission scoping:** an agent may only call the platforms listed in its registry `tools`
  entry. A call outside that scope is denied by the Infrastructure `policy.check`.
- **Human-in-the-loop (HITL):** when `hitl: on`, any high-impact / mutating sub-call pauses for
  approval (see the trace's HITL checkpoint).
- **Recursive governance:** every sub-call the agent makes still obeys the `pe-platforms` rules —
  it announces cross-layer hops, honors **self-service mode**, and is **audited** like any other
  platform call. The escape-hatch rules apply to the agent's sub-calls too.

## Self-service default

Agents run on the shared agent runtime with a default 6-step / $2.00 budget and HITL on — no infra
ticket needed. Raising the budget/step cap or granting broader tool scope escalates to the Infra
team (exceeds the paved-road default).
