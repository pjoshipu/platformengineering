# Connector — Application Platform  `[STUB]`

**Represents (real systems):** CI/CD (GitHub Actions / Argo), deploy (Argo Rollouts), runtime
(Cloud Run / GKE), feature flags (LaunchDarkly).
**Status:** `[STUB]` — not wired to a real system; all responses below are dummy data.
**Layer:** Specialist.
**Upstream dependencies:** Infrastructure (for compute, identity, observability).

## Serves (capabilities)

- `deployment.status` — current deployments and their health
- `pipeline.status` — recent CI/CD pipeline runs
- `flags.list` — active feature flags
- `app.provision` — spin up a new web app/service (scaffold repo + CI/CD + runtime + domain)

## Request contract

| Capability | Inputs |
|---|---|
| `deployment.status` | `service` (optional), `env` (default `prod`) |
| `pipeline.status` | `repo` (optional), `limit` (default 5) |
| `flags.list` | `service` (optional) |
| `app.provision` | `name`, `domain`, `runtime` (default `cloud-run`), `env` (default `staging`) |

## Dummy response

```json
{
  "deployment.status": [
    { "service": "checkout-api", "env": "prod", "version": "2.3.1", "health": "healthy", "replicas": "6/6" },
    { "service": "checkout-api", "env": "staging", "version": "2.4.0-rc2", "health": "degraded", "replicas": "2/3" }
  ],
  "pipeline.status": [
    { "repo": "checkout-api", "run": 8842, "status": "failed", "stage": "integration-tests", "failed_at": "2026-06-24T18:12Z" },
    { "repo": "checkout-api", "run": 8841, "status": "passed", "duration_s": 412 }
  ],
  "flags.list": [
    { "key": "new-checkout-ui", "state": "on", "rollout_pct": 25, "stale_days": 3 },
    { "key": "legacy-tax-calc", "state": "on", "rollout_pct": 100, "stale_days": 210 }
  ],
  "app.provision": {
    "name": "shipment-tracker",
    "repo": "github.com/pe-demo/shipment-tracker (scaffolded from web-app template)",
    "pipeline": "ci.yml created · first run queued",
    "runtime": "cloud-run · pe-demo namespace · autoscale 1–10",
    "url_staging": "https://shipment-tracker.staging.apps.pe-demo.dev",
    "status": "provisioned (staging)",
    "domain_binding": "PENDING — requires Infrastructure policy + DNS"
  }
}
```

## Self-service default

- **Runtime:** shared `pe-demo` Cloud Run namespace, autoscaling 1–10 — no infra ticket needed.
- **Domain:** a paved-road **preview/staging subdomain** (`*.staging.apps.pe-demo.dev`) is
  self-service. Binding a **production or external apex domain** (e.g. `fedex.com`) is **not**
  paved-road — it requires an Infrastructure hop for policy approval, DNS, TLS, and WAF.
