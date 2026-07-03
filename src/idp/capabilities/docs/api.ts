import { delay, daysAgo, hoursAgo, uid } from "../../api/client";

/**
 * Capability 2.1 — Documentation (persona-parameterized mock).
 *
 * ONE searchable knowledge base, persona-aware: `getDocs(persona, …)` returns
 * the doc types this persona authors, linked to catalog entries. Each doc has a
 * markdown-ish body, version history, tags, a linked asset, and comments.
 * Persona changes the default doc types + realistic content.
 */

export interface DocComment {
  id: string;
  author: string;
  body: string;
  ts: string;
}

export interface DocVersion {
  version: string;
  author: string;
  ts: string;
  note: string;
}

export interface Doc {
  id: string;
  title: string;
  type: string;
  tags: string[];
  author: string;
  updated_at: string;
  linked_asset?: string;
  body: string;
  versions: DocVersion[];
  comments: DocComment[];
}

export interface DocFilters {
  q?: string;
  type?: string; // "all" or a persona doc type
  author?: string; // "all" or an author
}

const DOCS: Record<string, Doc[]> = {
  "ai-engineer": [
    {
      id: "doc_ai_1",
      title: "support-rag — Runbook",
      type: "LLM app runbook",
      tags: ["rag", "runbook", "on-call"],
      author: "l.zhang",
      updated_at: hoursAgo(5),
      linked_asset: "support-rag",
      body: "# support-rag Runbook\n\n## Overview\nProduction RAG pipeline answering customer support tickets from the KB.\n\n## Escalation\n- **Faithfulness < 0.90**: page applied-ai on-call.\n- **Retriever empty**: check `kb-embedder` freshness.\n\n## Rollback\n`fedex rollback support-rag --to v1.3.9`",
      versions: [
        { version: "v3", author: "l.zhang", ts: hoursAgo(5), note: "Added faithfulness escalation threshold" },
        { version: "v2", author: "p.rao", ts: daysAgo(6), note: "Documented retriever fallback" },
        { version: "v1", author: "l.zhang", ts: daysAgo(20), note: "Initial runbook" },
      ],
      comments: [
        { id: "c_ai_1", author: "p.rao", body: "Should we link the guardrail explainer here too?", ts: hoursAgo(3) },
      ],
    },
    {
      id: "doc_ai_2",
      title: "Prompt design rationale — support triage",
      type: "Prompt-design rationale",
      tags: ["prompt", "design", "few-shot"],
      author: "p.rao",
      updated_at: daysAgo(1),
      linked_asset: "support-prompts",
      body: "# Prompt Design Rationale\n\nWe use a 3-shot template with an explicit refusal clause. Few-shot examples were chosen to cover the top 3 ticket categories.\n\n## Why not zero-shot\nZero-shot dropped category accuracy by ~11% in eval.",
      versions: [
        { version: "v2", author: "p.rao", ts: daysAgo(1), note: "Reworked refusal clause" },
        { version: "v1", author: "p.rao", ts: daysAgo(9), note: "Initial rationale" },
      ],
      comments: [],
    },
    {
      id: "doc_ai_3",
      title: "Guardrail explanations — PII + jailbreak filters",
      type: "Guardrail explanation",
      tags: ["guardrails", "safety", "pii"],
      author: "l.zhang",
      updated_at: daysAgo(2),
      linked_asset: "support-rag",
      body: "# Guardrails\n\n5 active guardrails:\n1. PII redaction (input + output)\n2. Jailbreak classifier\n3. Toxicity filter\n4. Grounding check\n5. Max-token clamp\n\nEach runs pre-response; a trip logs to the observability stream.",
      versions: [
        { version: "v2", author: "l.zhang", ts: daysAgo(2), note: "Added grounding check" },
        { version: "v1", author: "s.ito", ts: daysAgo(15), note: "Initial guardrail set" },
      ],
      comments: [
        { id: "c_ai_2", author: "s.ito", body: "Grounding check false-positives on numeric answers.", ts: daysAgo(1) },
        { id: "c_ai_3", author: "l.zhang", body: "Tracking in AIP-204.", ts: hoursAgo(20) },
      ],
    },
    {
      id: "doc_ai_4",
      title: "Cost tuning guide — gpt-4o-mini vs gpt-4o",
      type: "Cost-tuning guide",
      tags: ["cost", "tuning", "models"],
      author: "s.ito",
      updated_at: daysAgo(4),
      linked_asset: "support-rag",
      body: "# Cost Tuning\n\nRoute simple tickets to `gpt-4o-mini`, escalate ambiguous ones to `gpt-4o`. Cuts spend ~38% at <1% quality delta.\n\n## Caching\nEnable prompt caching for the static system prompt.",
      versions: [
        { version: "v2", author: "s.ito", ts: daysAgo(4), note: "Added caching section" },
        { version: "v1", author: "s.ito", ts: daysAgo(12), note: "Initial guide" },
      ],
      comments: [],
    },
    {
      id: "doc_ai_5",
      title: "Post-mortem — support-rag faithfulness drop 2026-06",
      type: "Post-mortem",
      tags: ["post-mortem", "incident", "quality"],
      author: "l.zhang",
      updated_at: daysAgo(7),
      linked_asset: "support-rag",
      body: "# Post-mortem: Faithfulness Drop\n\n## Impact\nFaithfulness fell to 0.78 for ~4h.\n\n## Root cause\nStale embeddings after `kb-embedder` reindex failed silently.\n\n## Actions\n- Add embedder freshness alert\n- Fail closed on empty retrieval",
      versions: [
        { version: "v1", author: "l.zhang", ts: daysAgo(7), note: "Initial post-mortem" },
      ],
      comments: [
        { id: "c_ai_4", author: "p.rao", body: "Freshness alert shipped, closing action item.", ts: daysAgo(5) },
      ],
    },
  ],
  "agentic-engineer": [
    {
      id: "doc_ag_1",
      title: "support-triage-agent — Design doc",
      type: "Agent design doc",
      tags: ["agent", "design", "triage"],
      author: "m.okafor",
      updated_at: hoursAgo(4),
      linked_asset: "support-triage-agent",
      body: "# support-triage-agent\n\n## Goal\nTriage inbound support tickets and route or auto-resolve.\n\n## Loop\nplan → act → observe, max 6 steps.\n\n## Runtime\nClaude Agent SDK, 5 tools.",
      versions: [
        { version: "v2", author: "m.okafor", ts: hoursAgo(4), note: "Raised step budget to 6" },
        { version: "v1", author: "m.okafor", ts: daysAgo(8), note: "Initial design" },
      ],
      comments: [
        { id: "c_ag_1", author: "d.singh", body: "Consider a checkpoint before the refund tool.", ts: hoursAgo(2) },
      ],
    },
    {
      id: "doc_ag_2",
      title: "Tool & permission rationale — infra-remediation-agent",
      type: "Tool/permission rationale",
      tags: ["tools", "permissions", "least-privilege"],
      author: "d.singh",
      updated_at: daysAgo(1),
      linked_asset: "infra-remediation-agent",
      body: "# Tool & Permission Rationale\n\n8 tools, each scoped to least privilege.\n\n- `k8s.rollout_restart`: cluster:write — gated behind approval\n- `metrics.query`: read-only\n\nWrite tools require human-in-the-loop.",
      versions: [
        { version: "v2", author: "d.singh", ts: daysAgo(1), note: "Gated write tools behind approval" },
        { version: "v1", author: "d.singh", ts: daysAgo(10), note: "Initial rationale" },
      ],
      comments: [],
    },
    {
      id: "doc_ag_3",
      title: "Autonomy policy — release-captain",
      type: "Autonomy-policy explanation",
      tags: ["autonomy", "policy", "release"],
      author: "m.okafor",
      updated_at: daysAgo(2),
      linked_asset: "release-captain",
      body: "# Autonomy Policy\n\nrelease-captain runs at **High** autonomy but pauses at:\n- prod deploy\n- rollback\n- any spend > $50/run\n\nAll pauses require an on-call approval in FedEx.",
      versions: [
        { version: "v2", author: "m.okafor", ts: daysAgo(2), note: "Added spend checkpoint" },
        { version: "v1", author: "r.mehta", ts: daysAgo(14), note: "Initial policy" },
      ],
      comments: [
        { id: "c_ag_2", author: "r.mehta", body: "Agent is currently paused pending review.", ts: hoursAgo(10) },
      ],
    },
    {
      id: "doc_ag_4",
      title: "Run post-mortem — remediation loop overran budget",
      type: "Run post-mortem",
      tags: ["post-mortem", "runs", "budget"],
      author: "d.singh",
      updated_at: daysAgo(5),
      linked_asset: "infra-remediation-agent",
      body: "# Run Post-mortem\n\n## What happened\nAgent looped on a flapping pod, hit the 8-step budget without resolving.\n\n## Fix\nAdd a repeat-action detector and back off to human.",
      versions: [
        { version: "v1", author: "d.singh", ts: daysAgo(5), note: "Initial post-mortem" },
      ],
      comments: [],
    },
    {
      id: "doc_ag_5",
      title: "claude-agent-runtime — Operations guide",
      type: "Agent design doc",
      tags: ["runtime", "ops", "sdk"],
      author: "r.mehta",
      updated_at: daysAgo(4),
      linked_asset: "claude-agent-runtime",
      body: "# Runtime Ops\n\nShared Claude Agent SDK runtime.\n\n## Scaling\nHorizontal, per-agent concurrency caps.\n\n## Observability\nEvery step emits a trace span to the platform stream.",
      versions: [
        { version: "v2", author: "r.mehta", ts: daysAgo(4), note: "Added concurrency caps" },
        { version: "v1", author: "r.mehta", ts: daysAgo(18), note: "Initial ops guide" },
      ],
      comments: [
        { id: "c_ag_3", author: "m.okafor", body: "Trace sampling at 100% is expensive — can we drop to 20%?", ts: daysAgo(3) },
      ],
    },
  ],
  "data-scientist": [
    {
      id: "doc_ds_1",
      title: "churn-predictor — Model card",
      type: "Model card",
      tags: ["model-card", "churn", "xgboost"],
      author: "a.ferreira",
      updated_at: daysAgo(2),
      linked_asset: "churn-predictor",
      body: "# Model Card: churn-predictor\n\n- **Framework**: XGBoost\n- **Metric**: AUC 0.891\n- **Training data**: customer-churn-2026\n\n## Intended use\nMonthly churn scoring for CRM.\n\n## Limitations\nUnderperforms on <30-day tenure accounts.",
      versions: [
        { version: "v3", author: "a.ferreira", ts: daysAgo(2), note: "Added limitations section" },
        { version: "v2", author: "j.park", ts: daysAgo(9), note: "Updated metrics" },
        { version: "v1", author: "a.ferreira", ts: daysAgo(21), note: "Initial card" },
      ],
      comments: [
        { id: "c_ds_1", author: "j.park", body: "Add fairness slice by region before prod sign-off.", ts: daysAgo(1) },
      ],
    },
    {
      id: "doc_ds_2",
      title: "Experiment notes — recsys-tower sweep",
      type: "Experiment note",
      tags: ["experiment", "recsys", "sweep"],
      author: "j.park",
      updated_at: hoursAgo(9),
      linked_asset: "recsys-tower",
      body: "# Experiment Notes\n\nSwept embedding dim {64,128,256}. 128 best (AUC 0.906). 256 overfit after epoch 4.\n\n## Next\nTry hard-negative mining.",
      versions: [
        { version: "v2", author: "j.park", ts: hoursAgo(9), note: "Logged 256-dim overfit" },
        { version: "v1", author: "j.park", ts: daysAgo(3), note: "Initial notes" },
      ],
      comments: [],
    },
    {
      id: "doc_ds_3",
      title: "Dataset usage guide — customer-churn-2026",
      type: "Dataset usage guide",
      tags: ["dataset", "usage", "pii"],
      author: "a.ferreira",
      updated_at: daysAgo(1),
      linked_asset: "customer-churn-2026",
      body: "# Dataset Usage\n\n**Restricted** — contains PII. Access via data-platform approval only.\n\n## Join keys\n`customer_id` → crm.customer_360.\n\n## Refresh\nDaily at 02:00 UTC.",
      versions: [
        { version: "v2", author: "a.ferreira", ts: daysAgo(1), note: "Documented refresh window" },
        { version: "v1", author: "n.abbas", ts: daysAgo(11), note: "Initial guide" },
      ],
      comments: [
        { id: "c_ds_2", author: "n.abbas", body: "Flag the PII columns explicitly here.", ts: hoursAgo(18) },
      ],
    },
    {
      id: "doc_ds_4",
      title: "Eval methodology — churn scoring",
      type: "Eval methodology",
      tags: ["eval", "methodology", "auc"],
      author: "j.park",
      updated_at: daysAgo(6),
      linked_asset: "churn-predictor",
      body: "# Eval Methodology\n\nTime-based split (train ≤ M-2, test = M-1). Primary metric AUC; secondary precision@decile-10.\n\nNo random shuffles — avoids leakage across billing cycles.",
      versions: [
        { version: "v2", author: "j.park", ts: daysAgo(6), note: "Switched to time-based split" },
        { version: "v1", author: "a.ferreira", ts: daysAgo(16), note: "Initial methodology" },
      ],
      comments: [],
    },
    {
      id: "doc_ds_5",
      title: "fraud-detection — Model card",
      type: "Model card",
      tags: ["model-card", "fraud", "pytorch"],
      author: "n.abbas",
      updated_at: hoursAgo(7),
      linked_asset: "fraud-detection",
      body: "# Model Card: fraud-detection\n\n- **Framework**: PyTorch\n- **Metric**: AUC 0.947\n- **Status**: In staging\n\n## Threshold\nOperating point tuned for 0.5% FPR.",
      versions: [
        { version: "v2", author: "n.abbas", ts: hoursAgo(7), note: "Tuned operating point" },
        { version: "v1", author: "n.abbas", ts: daysAgo(4), note: "Initial card" },
      ],
      comments: [
        { id: "c_ds_3", author: "a.ferreira", body: "Need a champion/challenger plan before prod.", ts: hoursAgo(5) },
      ],
    },
  ],
  "app-engineer": [
    {
      id: "doc_app_1",
      title: "checkout-api — README",
      type: "Service README",
      tags: ["service", "readme", "payments"],
      author: "t.nguyen",
      updated_at: hoursAgo(5),
      linked_asset: "checkout-api",
      body: "# checkout-api\n\nHandles cart checkout + payment intent creation.\n\n## Local dev\n`fedex dev checkout-api`\n\n## Routes\n`POST /api/checkout`\n\n## Owners\npayments team",
      versions: [
        { version: "v4", author: "t.nguyen", ts: hoursAgo(5), note: "Documented new idempotency header" },
        { version: "v3", author: "b.costa", ts: daysAgo(7), note: "Updated local dev steps" },
        { version: "v1", author: "t.nguyen", ts: daysAgo(30), note: "Initial README" },
      ],
      comments: [
        { id: "c_app_1", author: "b.costa", body: "Add the staging URL to the routes section.", ts: hoursAgo(3) },
      ],
    },
    {
      id: "doc_app_2",
      title: "ADR-014 — Adopt GitOps for deploys",
      type: "ADR",
      tags: ["adr", "gitops", "argocd"],
      author: "b.costa",
      updated_at: daysAgo(2),
      linked_asset: "checkout-api",
      body: "# ADR-014: GitOps\n\n## Status\nAccepted\n\n## Decision\nAll prod deploys go through Git-tracked manifests reconciled by Argo.\n\n## Consequences\nNo more manual kubectl in prod; drift is visible as 'Out of sync'.",
      versions: [
        { version: "v2", author: "b.costa", ts: daysAgo(2), note: "Marked Accepted" },
        { version: "v1", author: "b.costa", ts: daysAgo(13), note: "Proposed" },
      ],
      comments: [],
    },
    {
      id: "doc_app_3",
      title: "Score spec guide — service scaffolding",
      type: "Score-spec guide",
      tags: ["score", "spec", "scaffold"],
      author: "t.nguyen",
      updated_at: daysAgo(3),
      linked_asset: "inventory-svc",
      body: "# Score Spec Guide\n\n`score.yaml` declares containers, resources, and routes. The platform translates it to the target runtime.\n\n## Minimal example\n```yaml\napiVersion: score.dev/v1b1\ncontainers:\n  app:\n    image: .\n```",
      versions: [
        { version: "v2", author: "t.nguyen", ts: daysAgo(3), note: "Added minimal example" },
        { version: "v1", author: "b.costa", ts: daysAgo(17), note: "Initial guide" },
      ],
      comments: [
        { id: "c_app_2", author: "b.costa", body: "Link this from the new-service wizard.", ts: daysAgo(2) },
      ],
    },
    {
      id: "doc_app_4",
      title: "Deployment runbook — inventory-svc",
      type: "Deployment runbook",
      tags: ["runbook", "deploy", "rollback"],
      author: "b.costa",
      updated_at: hoursAgo(2),
      linked_asset: "inventory-svc",
      body: "# Deployment Runbook\n\n## Deploy\n`fedex deploy inventory-svc --env staging`\n\n## Verify\nCheck sync status is 'Synced' and health 'Healthy'.\n\n## Rollback\nRevert the manifest commit; Argo reconciles.",
      versions: [
        { version: "v3", author: "b.costa", ts: hoursAgo(2), note: "Added Argo reconcile note" },
        { version: "v2", author: "t.nguyen", ts: daysAgo(5), note: "Documented verify step" },
        { version: "v1", author: "b.costa", ts: daysAgo(19), note: "Initial runbook" },
      ],
      comments: [],
    },
    {
      id: "doc_app_5",
      title: "payments-gateway — README",
      type: "Service README",
      tags: ["service", "readme", "api"],
      author: "t.nguyen",
      updated_at: daysAgo(1),
      linked_asset: "payments-gateway",
      body: "# payments-gateway\n\nProd payment routing API.\n\n## Routes\n`POST /api/payments`\n\n## SLOs\n99.95% availability, p99 < 250ms.",
      versions: [
        { version: "v2", author: "t.nguyen", ts: daysAgo(1), note: "Added SLOs" },
        { version: "v1", author: "t.nguyen", ts: daysAgo(22), note: "Initial README" },
      ],
      comments: [
        { id: "c_app_3", author: "b.costa", body: "SLO looks tight for p99 — confirm with SRE.", ts: hoursAgo(20) },
      ],
    },
  ],
  mlops: [
    {
      id: "doc_ml_1",
      title: "churn-training — Pipeline design",
      type: "Pipeline design doc",
      tags: ["pipeline", "design", "training"],
      author: "e.varga",
      updated_at: hoursAgo(3),
      linked_asset: "churn-training",
      body: "# churn-training Pipeline\n\n## Schedule\n`0 */6 * * *` on gpu-a100.\n\n## Stages\ningest → featureize → train → eval → register.\n\n## Auto-retrain\nTriggered when drift > 0.60.",
      versions: [
        { version: "v3", author: "e.varga", ts: hoursAgo(3), note: "Added auto-retrain trigger" },
        { version: "v2", author: "k.lee", ts: daysAgo(8), note: "Split eval stage" },
        { version: "v1", author: "e.varga", ts: daysAgo(24), note: "Initial design" },
      ],
      comments: [
        { id: "c_ml_1", author: "k.lee", body: "Drift is Critical right now — is auto-retrain firing?", ts: hoursAgo(1) },
      ],
    },
    {
      id: "doc_ml_2",
      title: "Drift threshold rationale — churn-drift-monitor",
      type: "Drift-threshold rationale",
      tags: ["drift", "threshold", "monitoring"],
      author: "k.lee",
      updated_at: daysAgo(2),
      linked_asset: "churn-drift-monitor",
      body: "# Drift Threshold Rationale\n\nPSI > 0.60 = auto-retrain, 0.20–0.60 = warning.\n\nThresholds derived from 6 months of backtests balancing retrain cost vs. accuracy decay.",
      versions: [
        { version: "v2", author: "k.lee", ts: daysAgo(2), note: "Lowered warning band" },
        { version: "v1", author: "k.lee", ts: daysAgo(15), note: "Initial rationale" },
      ],
      comments: [],
    },
    {
      id: "doc_ml_3",
      title: "Retraining guide — scheduled + triggered",
      type: "Retraining guide",
      tags: ["retraining", "guide", "ops"],
      author: "e.varga",
      updated_at: daysAgo(4),
      linked_asset: "churn-training",
      body: "# Retraining Guide\n\n## Manual\n`fedex pipeline trigger churn-training`\n\n## Validation gate\nNew model must beat champion AUC by ≥ 0.005 to auto-promote.",
      versions: [
        { version: "v2", author: "e.varga", ts: daysAgo(4), note: "Added promotion gate" },
        { version: "v1", author: "k.lee", ts: daysAgo(12), note: "Initial guide" },
      ],
      comments: [
        { id: "c_ml_2", author: "k.lee", body: "Promotion gate should also check calibration.", ts: daysAgo(3) },
      ],
    },
    {
      id: "doc_ml_4",
      title: "Infra sizing — training compute",
      type: "Infra sizing",
      tags: ["infra", "sizing", "gpu"],
      author: "k.lee",
      updated_at: daysAgo(6),
      linked_asset: "churn-training",
      body: "# Infra Sizing\n\ngpu-a100 x1 sufficient for churn (< 40min/run). ltv-training needs x2 due to larger feature set.\n\n## Cost\n~$8/run at current utilization.",
      versions: [
        { version: "v1", author: "k.lee", ts: daysAgo(6), note: "Initial sizing" },
      ],
      comments: [],
    },
    {
      id: "doc_ml_5",
      title: "ltv-training — Pipeline design",
      type: "Pipeline design doc",
      tags: ["pipeline", "design", "ltv"],
      author: "e.varga",
      updated_at: daysAgo(1),
      linked_asset: "ltv-training",
      body: "# ltv-training Pipeline\n\n## Schedule\n`@daily`, manual promotion only.\n\n## Status\nLast run FAILED — OOM on feature join. Needs x2 gpu-a100.",
      versions: [
        { version: "v2", author: "e.varga", ts: daysAgo(1), note: "Documented OOM failure" },
        { version: "v1", author: "e.varga", ts: daysAgo(10), note: "Initial design" },
      ],
      comments: [
        { id: "c_ml_3", author: "k.lee", body: "Bump to x2 gpu-a100 per infra sizing doc.", ts: hoursAgo(22) },
      ],
    },
  ],
  security: [
    {
      id: "doc_sec_1",
      title: "require-resource-limits — Policy description",
      type: "Policy description",
      tags: ["policy", "opa", "resource-limits"],
      author: "o.haddad",
      updated_at: daysAgo(2),
      linked_asset: "require-resource-limits",
      body: "# Policy: require-resource-limits\n\nAll workloads must declare CPU + memory limits.\n\n## Enforcement\nOPA gate at admission. Currently 4 violations org-wide.\n\n## Exceptions\nRequire a signed waiver.",
      versions: [
        { version: "v3", author: "o.haddad", ts: daysAgo(2), note: "Added waiver process" },
        { version: "v2", author: "f.klein", ts: daysAgo(9), note: "Moved to admission gate" },
        { version: "v1", author: "o.haddad", ts: daysAgo(20), note: "Initial policy" },
      ],
      comments: [
        { id: "c_sec_1", author: "f.klein", body: "checkout-api still non-compliant — track remediation.", ts: hoursAgo(6) },
      ],
    },
    {
      id: "doc_sec_2",
      title: "Compliance mapping — SOC 2 controls",
      type: "Compliance mapping",
      tags: ["compliance", "soc2", "mapping"],
      author: "f.klein",
      updated_at: daysAgo(3),
      linked_asset: "checkout-api",
      body: "# SOC 2 Control Mapping\n\n| Control | Platform check |\n|---|---|\n| CC6.1 | OPA access policies |\n| CC7.2 | Observability + alerting |\n| CC8.1 | GitOps change mgmt |",
      versions: [
        { version: "v2", author: "f.klein", ts: daysAgo(3), note: "Added CC8.1 mapping" },
        { version: "v1", author: "f.klein", ts: daysAgo(14), note: "Initial mapping" },
      ],
      comments: [],
    },
    {
      id: "doc_sec_3",
      title: "IR playbook — data exfiltration",
      type: "IR playbook",
      tags: ["ir", "playbook", "exfiltration"],
      author: "o.haddad",
      updated_at: hoursAgo(8),
      linked_asset: "customer-churn-2026",
      body: "# IR Playbook: Data Exfiltration\n\n1. Revoke suspect access tokens\n2. Snapshot audit trail\n3. Notify DPO within 1h\n4. Contain via network policy\n\n## Escalation\nP1 — page security on-call + legal.",
      versions: [
        { version: "v2", author: "o.haddad", ts: hoursAgo(8), note: "Added DPO notification SLA" },
        { version: "v1", author: "o.haddad", ts: daysAgo(11), note: "Initial playbook" },
      ],
      comments: [
        { id: "c_sec_2", author: "f.klein", body: "Add the token-revocation CLI command inline.", ts: hoursAgo(4) },
      ],
    },
    {
      id: "doc_sec_4",
      title: "Access guide — restricted datasets",
      type: "Access guide",
      tags: ["access", "rbac", "datasets"],
      author: "f.klein",
      updated_at: daysAgo(5),
      linked_asset: "customer-churn-2026",
      body: "# Access Guide: Restricted Datasets\n\nRestricted datasets require data-platform approval + a documented purpose.\n\n## Request\n`fedex access request <dataset> --reason ...`\n\nAccess auto-expires after 90 days.",
      versions: [
        { version: "v2", author: "f.klein", ts: daysAgo(5), note: "Added 90-day expiry" },
        { version: "v1", author: "o.haddad", ts: daysAgo(16), note: "Initial guide" },
      ],
      comments: [],
    },
    {
      id: "doc_sec_5",
      title: "Policy description — deny-public-buckets",
      type: "Policy description",
      tags: ["policy", "opa", "storage"],
      author: "o.haddad",
      updated_at: daysAgo(1),
      linked_asset: "payments_reconcile",
      body: "# Policy: deny-public-buckets\n\nBlocks any storage bucket with public ACLs.\n\n## Enforcement\nOPA gate + nightly drift scan on IaC.\n\npayments_reconcile flagged non-compliant (74% OPA score).",
      versions: [
        { version: "v2", author: "o.haddad", ts: daysAgo(1), note: "Added nightly drift scan" },
        { version: "v1", author: "o.haddad", ts: daysAgo(13), note: "Initial policy" },
      ],
      comments: [
        { id: "c_sec_3", author: "f.klein", body: "Remediation ticket opened for payments_reconcile.", ts: hoursAgo(12) },
      ],
    },
  ],
  "data-engineer": [
    {
      id: "doc_de_1",
      title: "analytics.orders_daily — Dataset doc",
      type: "Dataset doc",
      tags: ["dataset", "orders", "published"],
      author: "s.malik",
      updated_at: hoursAgo(6),
      linked_asset: "analytics.orders_daily",
      body: "# analytics.orders_daily\n\nDaily-aggregated orders fact table.\n\n## Grain\none row per (order_date, product_id).\n\n## Consumers\n5 downstream models. Quality currently 98%.",
      versions: [
        { version: "v3", author: "s.malik", ts: hoursAgo(6), note: "Documented grain" },
        { version: "v2", author: "y.chen", ts: daysAgo(7), note: "Added consumer list" },
        { version: "v1", author: "s.malik", ts: daysAgo(23), note: "Initial doc" },
      ],
      comments: [
        { id: "c_de_1", author: "y.chen", body: "Late-arriving orders — do we backfill grain?", ts: hoursAgo(4) },
      ],
    },
    {
      id: "doc_de_2",
      title: "orders_daily_agg — Pipeline design",
      type: "Pipeline design note",
      tags: ["pipeline", "design", "batch"],
      author: "y.chen",
      updated_at: daysAgo(2),
      linked_asset: "orders_daily_agg",
      body: "# orders_daily_agg Pipeline\n\n## Schedule\n`0 2 * * *`.\n\n## Steps\nextract → dedupe → aggregate → publish.\n\n## Idempotency\nPartition overwrite by order_date.",
      versions: [
        { version: "v2", author: "y.chen", ts: daysAgo(2), note: "Made publish idempotent" },
        { version: "v1", author: "s.malik", ts: daysAgo(12), note: "Initial design" },
      ],
      comments: [],
    },
    {
      id: "doc_de_3",
      title: "DQ rationale — feature_churn_signals",
      type: "DQ rationale",
      tags: ["dq", "quality", "rationale"],
      author: "s.malik",
      updated_at: hoursAgo(7),
      linked_asset: "feature_churn_signals",
      body: "# Data Quality Rationale\n\nChecks: null-rate < 2%, freshness < 26h, row-count within ±15% of 7-day median.\n\npipeline FAILED — quality dropped to 63% on a schema mismatch.",
      versions: [
        { version: "v2", author: "s.malik", ts: hoursAgo(7), note: "Logged 63% failure" },
        { version: "v1", author: "y.chen", ts: daysAgo(10), note: "Initial checks" },
      ],
      comments: [
        { id: "c_de_2", author: "y.chen", body: "Upstream added a column — see schema change log.", ts: hoursAgo(5) },
      ],
    },
    {
      id: "doc_de_4",
      title: "Schema change log — customer_activity",
      type: "Schema change log",
      tags: ["schema", "changelog", "feature-group"],
      author: "y.chen",
      updated_at: hoursAgo(18),
      linked_asset: "customer_activity",
      body: "# Schema Change Log\n\n- 2026-07-01: added `last_session_ts` (nullable)\n- 2026-06-20: widened `region` to STRING\n- 2026-06-02: initial schema\n\nBreaking changes require a consumer sign-off.",
      versions: [
        { version: "v3", author: "y.chen", ts: hoursAgo(18), note: "Added last_session_ts entry" },
        { version: "v2", author: "s.malik", ts: daysAgo(6), note: "region widened" },
        { version: "v1", author: "y.chen", ts: daysAgo(31), note: "Initial log" },
      ],
      comments: [],
    },
    {
      id: "doc_de_5",
      title: "Feature engineering guide — churn signals",
      type: "Feature-eng guide",
      tags: ["feature-eng", "guide", "churn"],
      author: "s.malik",
      updated_at: daysAgo(4),
      linked_asset: "customer_activity",
      body: "# Feature Engineering Guide\n\nRolling windows: 7d / 30d / 90d activity counts, recency, and monetary value.\n\n## Serving\nMaterialized hourly into the feature group.",
      versions: [
        { version: "v2", author: "s.malik", ts: daysAgo(4), note: "Added 90d window" },
        { version: "v1", author: "s.malik", ts: daysAgo(15), note: "Initial guide" },
      ],
      comments: [
        { id: "c_de_3", author: "y.chen", body: "Consider a decay-weighted recency feature.", ts: daysAgo(2) },
      ],
    },
  ],
};

export async function getDocs(personaId: string, filters: DocFilters = {}): Promise<Doc[]> {
  await delay();
  const docs = DOCS[personaId] ?? [];
  const q = (filters.q ?? "").trim().toLowerCase();
  return docs.filter(
    (d) =>
      (!q ||
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        (d.linked_asset ?? "").toLowerCase().includes(q)) &&
      (!filters.type || filters.type === "all" || d.type === filters.type) &&
      (!filters.author || filters.author === "all" || d.author === filters.author)
  );
}

export async function getDoc(personaId: string, id: string): Promise<Doc | undefined> {
  await delay(200);
  return (DOCS[personaId] ?? []).find((d) => d.id === id);
}

export async function createDoc(
  personaId: string,
  body: { title: string; type: string; tags: string[]; body: string; linked_asset?: string }
): Promise<{ doc_id: string }> {
  await delay();
  return { doc_id: uid("doc") };
}

export async function addComment(docId: string, body: string): Promise<{ comment_id: string }> {
  await delay();
  return { comment_id: uid("c") };
}
