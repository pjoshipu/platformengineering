# Connector — Infrastructure (Foundational) Platform  `[STUB]`

**Represents (real systems):** Identity (IAM / Okta), Policy (OPA / org policy), Observability
(Prometheus / Cloud Monitoring), compute (GKE / BigQuery slots / GPU quota).
**Status:** `[STUB]` — not wired to a real system; all responses below are dummy data.
**Layer:** Foundational (the base — no upstream dependencies).
**Upstream dependencies:** none.

This is the layer product teams most want to *avoid* depending on directly. It exposes paved-road
**self-service defaults** so specialist platforms can serve most requests without an infra ticket.

## Serves (capabilities)

- `identity.check` — who is the caller, what roles
- `policy.check` — does this request pass org policy
- `compute.grant` — grant compute (slots / GPUs / nodes)
- `observability.metrics` — current health/SLO metrics
- `domain.bind` — bind a domain (DNS + TLS + WAF) to a service

## Request contract

| Capability | Inputs |
|---|---|
| `identity.check` | `principal` |
| `policy.check` | `action`, `resource` |
| `compute.grant` | `kind` (`bq-slots`/`gpu`/`nodes`), `amount` |
| `observability.metrics` | `service` |
| `domain.bind` | `domain`, `service` |

## Dummy response

```json
{
  "identity.check": { "principal": "dev@pe-demo", "roles": ["data-reader", "ai-user"], "mfa": true },
  "policy.check": { "action": "train.submit", "resource": "customer_churn_v3", "decision": "allow", "note": "PII dataset — training allowed under DLP policy v4" },
  "compute.grant": { "kind": "gpu", "amount": "4×A100", "region": "us-central1", "from": "shared-gpu-pool", "ticket_required": false },
  "observability.metrics": { "service": "checkout-api", "slo": "99.9%", "error_rate_5m": "0.4%", "p95_ms": 230 },
  "domain.bind": {
    "domain": "fedex.com",
    "service": "shipment-tracker",
    "decision": "escalate",
    "ticket_required": true,
    "reason": "external production apex domain — not a paved-road default; requires domain-owner approval, managed TLS cert, and WAF policy",
    "ticket": "INFRA-4471 (assigned: platform-networking)",
    "paved_road_alternative": "https://shipment-tracker.staging.apps.pe-demo.dev (self-service, available now)"
  }
}
```

## Self-service / paved-road defaults

| Need | Paved-road default (no infra ticket) | Escalates to infra team when… |
|---|---|---|
| BigQuery slots | shared on-demand pool | reserved capacity / > 2000 slots |
| GPU | shared GPU pool (≤ 8 GPUs) | dedicated node pool / > 8 GPUs |
| Identity | self-serve `data-reader` / `ai-user` roles | privileged / write-to-prod roles |
| Policy | auto-allow within DLP v4 | exceptions to policy |

`compute.grant` returns `ticket_required: false` whenever the request fits a paved-road default —
that is the signal the AI/Data platform can stay self-service and not engage the infra team.
