# Connector — AI Platform  `[STUB]`

**Represents (real systems):** model gateway (Claude / OpenAI), Vertex AI training, a vector store
(pgvector / Vertex Matching Engine), an embeddings service.
**Status:** `[STUB]` — not wired to a real system; all responses below are dummy data.
**Layer:** Specialist.
**Upstream dependencies:** Data (for features / corpora), Infrastructure (for GPU quota, identity).

## Serves (capabilities)

- `model.list` — available models on the gateway
- `train.submit` — submit a (dummy) training run
- `embed.search` — vector search over a corpus
- `inference.run` — a (dummy) prediction

## Request contract

| Capability | Inputs |
|---|---|
| `model.list` | — |
| `train.submit` | `dataset`, `model_type`, `accelerator` (optional) |
| `embed.search` | `corpus`, `query`, `k` (default 3) |
| `inference.run` | `model`, `input` |

## Dummy response

```json
{
  "model.list": [
    { "name": "claude-opus-4-8", "kind": "chat", "context": "1M", "status": "ready" },
    { "name": "churn-xgb-v2", "kind": "tabular", "status": "ready" }
  ],
  "train.submit": {
    "job_id": "train-7c21",
    "dataset": "customer_churn_v3",
    "model_type": "xgboost",
    "status": "submitted",
    "eta_min": 22,
    "accelerator": "shared-gpu-pool"
  },
  "embed.search": [
    { "doc": "runbook/checkout-rollback.md", "score": 0.91 },
    { "doc": "adr/0007-feature-store.md", "score": 0.83 }
  ],
  "inference.run": { "model": "churn-xgb-v2", "prediction": 0.78, "label": "likely_churn" }
}
```

## Self-service default

Models served via the shared gateway with the team's existing key; training uses the **shared GPU
pool** (paved road) rather than a dedicated, infra-provisioned cluster. This is what self-service
mode uses to avoid an Infra-team request. Escalate to a real Infra hop only if the run needs more
than the paved-road cap (e.g. > 8 GPUs or a dedicated node pool).
