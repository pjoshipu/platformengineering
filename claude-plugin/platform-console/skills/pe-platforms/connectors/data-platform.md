# Connector — Data Platform  `[STUB]`

**Represents (real systems):** BigQuery, Snowflake, GCS data lake, dbt, a lineage catalog.
**Status:** `[STUB]` — not wired to a real system; all responses below are dummy data.
**Layer:** Specialist.
**Upstream dependencies:** Infrastructure (for query compute / BigQuery slots, identity).

## Serves (capabilities)

- `dataset.find` — locate a dataset by topic
- `dataset.profile` — row count, freshness, schema summary
- `query.sample` — a sample query result

## Request contract

| Capability | Inputs |
|---|---|
| `dataset.find` | `topic` (e.g. "churn", "billing") |
| `dataset.profile` | `dataset` |
| `query.sample` | `dataset`, `select` (optional) |

## Dummy response

```json
{
  "dataset.find": [
    { "dataset": "customer_churn_v3", "domain": "growth", "owner": "data-growth@pe-demo", "pii": true },
    { "dataset": "billing_events", "domain": "finance", "owner": "data-fin@pe-demo", "pii": false },
    { "dataset": "shipment_delays", "domain": "logistics", "owner": "data-supply@pe-demo", "pii": false }
  ],
  "dataset.profile": {
    "customer_churn_v3": {
      "rows": 1200000,
      "features": 38,
      "last_refreshed": "2026-06-24T03:00Z",
      "freshness": "fresh",
      "schema": ["customer_id", "tenure_months", "monthly_charges", "support_tickets_90d", "churned"]
    },
    "shipment_delays": {
      "rows": 3400000,
      "features": 22,
      "last_refreshed": "2026-06-24T06:00Z",
      "freshness": "fresh",
      "schema": ["shipment_id", "origin_hub", "dest_hub", "carrier", "distance_km", "weather_idx", "promised_days", "actual_days", "delayed"]
    },
    "billing_events": {
      "rows": 8500000,
      "features": 19,
      "last_refreshed": "2026-06-24T05:30Z",
      "freshness": "fresh",
      "pci_scope": true,
      "schema": ["event_id", "account_id", "invoice_amount", "currency", "payment_method", "days_to_due", "prior_late_payments", "auto_pay", "payment_failed"]
    }
  },
  "query.sample": [
    { "customer_id": "C-100482", "tenure_months": 14, "monthly_charges": 79.9, "churned": 0 },
    { "customer_id": "C-100517", "tenure_months": 2, "monthly_charges": 110.0, "churned": 1 }
  ]
}
```

## Self-service default

Read-only access to the `pe-demo` analytics project via the shared `data-reader` role; on-demand
BigQuery slots from the shared pool — no infra ticket needed for read workloads.
