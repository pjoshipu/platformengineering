import { delay } from "../../api/client";

/**
 * Capability 1.3 — Assessment Scorecards (persona-parameterized mock).
 *
 * ONE scorecards screen, persona-aware: `getScorecards(persona)` returns the
 * assets that persona is assessed on against platform standards. Each asset has
 * an overall score (0–100) and a gap checklist derived from that persona's
 * scored dimensions (from IDP_SCREEN_REQUIREMENTS.md 1.3). Failing gaps carry a
 * short "Fix …" action that deep-links to the fixing screen (toast here).
 *
 * Security is org-wide: alongside its per-team assets it exposes an org score +
 * per-team breakdown via `getScorecardSummary()`.
 */

export interface Gap {
  id: string;
  label: string;
  status: "pass" | "fail";
  action: string;
}

export interface Scorecard {
  asset_id: string;
  name: string;
  score: number;
  gaps: Gap[];
}

const g = (id: string, label: string, status: "pass" | "fail", action: string): Gap => ({
  id,
  label,
  status,
  action,
});

const SCORECARDS: Record<string, Scorecard[]> = {
  "ai-engineer": [
    {
      asset_id: "app_1",
      name: "support-rag",
      score: 92,
      gaps: [
        g("gc", "Guardrail coverage", "pass", "Add missing guardrails"),
        g("pv", "Prompt version control", "pass", "Register prompts in the prompt registry"),
        g("ob", "Observability setup", "pass", "Enable tracing + dashboards"),
        g("cc", "Cost per call", "pass", "Set a per-call cost budget"),
        g("hr", "Hallucination rate", "fail", "Tune retrieval + tighten grounding prompt"),
        g("cp", "Canary process used", "pass", "Route new versions through canary"),
      ],
    },
    {
      asset_id: "app_3",
      name: "sql-copilot",
      score: 64,
      gaps: [
        g("gc", "Guardrail coverage", "fail", "Add SQL-injection + PII output guardrails"),
        g("pv", "Prompt version control", "fail", "Register prompts in the prompt registry"),
        g("ob", "Observability setup", "pass", "Enable tracing + dashboards"),
        g("cc", "Cost per call", "fail", "Set a per-call cost budget"),
        g("hr", "Hallucination rate", "fail", "Tune retrieval + tighten grounding prompt"),
        g("cp", "Canary process used", "pass", "Route new versions through canary"),
      ],
    },
    {
      asset_id: "app_2",
      name: "docs-assistant",
      score: 88,
      gaps: [
        g("gc", "Guardrail coverage", "pass", "Add missing guardrails"),
        g("pv", "Prompt version control", "pass", "Register prompts in the prompt registry"),
        g("ob", "Observability setup", "fail", "Enable tracing + dashboards"),
        g("cc", "Cost per call", "pass", "Set a per-call cost budget"),
        g("hr", "Hallucination rate", "pass", "Tune retrieval + tighten grounding prompt"),
        g("cp", "Canary process used", "pass", "Route new versions through canary"),
      ],
    },
    {
      asset_id: "app_5",
      name: "kb-embedder",
      score: 96,
      gaps: [
        g("gc", "Guardrail coverage", "pass", "Add missing guardrails"),
        g("pv", "Prompt version control", "pass", "Register prompts in the prompt registry"),
        g("ob", "Observability setup", "pass", "Enable tracing + dashboards"),
        g("cc", "Cost per call", "pass", "Set a per-call cost budget"),
        g("hr", "Hallucination rate", "pass", "Tune retrieval + tighten grounding prompt"),
        g("cp", "Canary process used", "pass", "Route new versions through canary"),
      ],
    },
  ],
  "agentic-engineer": [
    {
      asset_id: "ag_1",
      name: "support-triage-agent",
      score: 90,
      gaps: [
        g("ab", "Autonomy budget defined", "pass", "Set an autonomy budget"),
        g("hitl", "HITL on write-tools", "pass", "Require approval on write-tools"),
        g("lp", "Least-privilege tool scopes", "pass", "Tighten tool scopes"),
        g("sr", "Run success rate", "pass", "Investigate failing runs"),
        g("ev", "Eval coverage", "fail", "Add an eval suite for core tasks"),
        g("rt", "Run traces enabled", "pass", "Enable run tracing"),
      ],
    },
    {
      asset_id: "ag_2",
      name: "infra-remediation-agent",
      score: 71,
      gaps: [
        g("ab", "Autonomy budget defined", "pass", "Set an autonomy budget"),
        g("hitl", "HITL on write-tools", "fail", "Require approval on write-tools"),
        g("lp", "Least-privilege tool scopes", "fail", "Tighten cluster:write scopes"),
        g("sr", "Run success rate", "fail", "Investigate failing runs"),
        g("ev", "Eval coverage", "pass", "Add an eval suite for core tasks"),
        g("rt", "Run traces enabled", "pass", "Enable run tracing"),
      ],
    },
    {
      asset_id: "ag_4",
      name: "release-captain",
      score: 78,
      gaps: [
        g("ab", "Autonomy budget defined", "fail", "Set an autonomy budget for High autonomy"),
        g("hitl", "HITL on write-tools", "pass", "Require approval on write-tools"),
        g("lp", "Least-privilege tool scopes", "pass", "Tighten tool scopes"),
        g("sr", "Run success rate", "pass", "Investigate failing runs"),
        g("ev", "Eval coverage", "fail", "Add an eval suite for core tasks"),
        g("rt", "Run traces enabled", "pass", "Enable run tracing"),
      ],
    },
    {
      asset_id: "ag_3",
      name: "data-export-agent",
      score: 85,
      gaps: [
        g("ab", "Autonomy budget defined", "pass", "Set an autonomy budget"),
        g("hitl", "HITL on write-tools", "pass", "Require approval on write-tools"),
        g("lp", "Least-privilege tool scopes", "fail", "Scope to read-only exports"),
        g("sr", "Run success rate", "pass", "Investigate failing runs"),
        g("ev", "Eval coverage", "pass", "Add an eval suite for core tasks"),
        g("rt", "Run traces enabled", "pass", "Enable run tracing"),
      ],
    },
  ],
  "data-scientist": [
    {
      asset_id: "mdl_churn",
      name: "churn-predictor",
      score: 93,
      gaps: [
        g("doc", "Model-doc completeness", "pass", "Complete the model card"),
        g("em", "Eval metric coverage", "pass", "Add missing eval metrics"),
        g("repro", "Reproducibility (dataset+hyperparams logged)", "pass", "Log dataset + hyperparams"),
        g("appr", "Approval process followed", "pass", "Submit for approval"),
      ],
    },
    {
      asset_id: "mdl_fraud",
      name: "fraud-detection",
      score: 81,
      gaps: [
        g("doc", "Model-doc completeness", "fail", "Complete the model card"),
        g("em", "Eval metric coverage", "pass", "Add missing eval metrics"),
        g("repro", "Reproducibility (dataset+hyperparams logged)", "fail", "Log dataset + hyperparams"),
        g("appr", "Approval process followed", "pass", "Submit for approval"),
      ],
    },
    {
      asset_id: "exp_recsys",
      name: "recsys-tower",
      score: 68,
      gaps: [
        g("doc", "Model-doc completeness", "fail", "Complete the model card"),
        g("em", "Eval metric coverage", "fail", "Add offline + online eval metrics"),
        g("repro", "Reproducibility (dataset+hyperparams logged)", "pass", "Log dataset + hyperparams"),
        g("appr", "Approval process followed", "fail", "Submit for approval before promotion"),
      ],
    },
    {
      asset_id: "mdl_ltv",
      name: "ltv-regressor",
      score: 89,
      gaps: [
        g("doc", "Model-doc completeness", "pass", "Complete the model card"),
        g("em", "Eval metric coverage", "pass", "Add missing eval metrics"),
        g("repro", "Reproducibility (dataset+hyperparams logged)", "fail", "Log dataset + hyperparams"),
        g("appr", "Approval process followed", "pass", "Submit for approval"),
      ],
    },
  ],
  "app-engineer": [
    {
      asset_id: "svc_1",
      name: "checkout-api",
      score: 94,
      gaps: [
        g("rl", "Resource limits defined", "pass", "Define CPU/memory limits"),
        g("hc", "Health checks configured", "pass", "Add liveness/readiness probes"),
        g("go", "GitOps sync healthy", "pass", "Reconcile GitOps drift"),
        g("kong", "Kong route secured", "pass", "Attach auth plugin to the route"),
        g("dep", "Dependency declarations complete", "pass", "Declare all dependencies"),
      ],
    },
    {
      asset_id: "svc_3",
      name: "inventory-svc",
      score: 66,
      gaps: [
        g("rl", "Resource limits defined", "fail", "Define CPU/memory limits"),
        g("hc", "Health checks configured", "fail", "Add liveness/readiness probes"),
        g("go", "GitOps sync healthy", "fail", "Reconcile GitOps drift"),
        g("kong", "Kong route secured", "pass", "Attach auth plugin to the route"),
        g("dep", "Dependency declarations complete", "pass", "Declare all dependencies"),
      ],
    },
    {
      asset_id: "svc_4",
      name: "notifications",
      score: 83,
      gaps: [
        g("rl", "Resource limits defined", "pass", "Define CPU/memory limits"),
        g("hc", "Health checks configured", "pass", "Add liveness/readiness probes"),
        g("go", "GitOps sync healthy", "pass", "Reconcile GitOps drift"),
        g("kong", "Kong route secured", "fail", "Attach auth plugin to the route"),
        g("dep", "Dependency declarations complete", "fail", "Declare all dependencies"),
      ],
    },
    {
      asset_id: "svc_2",
      name: "payments-gateway",
      score: 97,
      gaps: [
        g("rl", "Resource limits defined", "pass", "Define CPU/memory limits"),
        g("hc", "Health checks configured", "pass", "Add liveness/readiness probes"),
        g("go", "GitOps sync healthy", "pass", "Reconcile GitOps drift"),
        g("kong", "Kong route secured", "pass", "Attach auth plugin to the route"),
        g("dep", "Dependency declarations complete", "pass", "Declare all dependencies"),
      ],
    },
  ],
  mlops: [
    {
      asset_id: "pl_1",
      name: "churn-training + churn-predictor",
      score: 76,
      gaps: [
        g("dm", "Drift monitor attached", "pass", "Attach a drift monitor"),
        g("rr", "Retraining rule defined", "pass", "Define a retraining rule"),
        g("rf", "Run frequency", "pass", "Set an appropriate schedule"),
        g("at", "Alert thresholds set", "fail", "Set drift/failure alert thresholds"),
        g("lr", "Last successful run recency", "fail", "Fix pipeline so it runs on schedule"),
      ],
    },
    {
      asset_id: "pl_4",
      name: "ltv-training + ltv-regressor",
      score: 62,
      gaps: [
        g("dm", "Drift monitor attached", "fail", "Attach a drift monitor"),
        g("rr", "Retraining rule defined", "fail", "Define a retraining rule (currently manual)"),
        g("rf", "Run frequency", "pass", "Set an appropriate schedule"),
        g("at", "Alert thresholds set", "fail", "Set drift/failure alert thresholds"),
        g("lr", "Last successful run recency", "fail", "Fix failed run"),
      ],
    },
    {
      asset_id: "pl_2",
      name: "fraud-training + fraud-detection",
      score: 91,
      gaps: [
        g("dm", "Drift monitor attached", "pass", "Attach a drift monitor"),
        g("rr", "Retraining rule defined", "pass", "Define a retraining rule"),
        g("rf", "Run frequency", "pass", "Set an appropriate schedule"),
        g("at", "Alert thresholds set", "pass", "Set drift/failure alert thresholds"),
        g("lr", "Last successful run recency", "fail", "Fix pipeline so it runs on schedule"),
      ],
    },
    {
      asset_id: "pl_5",
      name: "recsys-training + recsys-tower",
      score: 84,
      gaps: [
        g("dm", "Drift monitor attached", "pass", "Attach a drift monitor"),
        g("rr", "Retraining rule defined", "pass", "Define a retraining rule"),
        g("rf", "Run frequency", "fail", "Set an appropriate schedule"),
        g("at", "Alert thresholds set", "pass", "Set drift/failure alert thresholds"),
        g("lr", "Last successful run recency", "pass", "Fix pipeline so it runs on schedule"),
      ],
    },
  ],
  security: [
    {
      asset_id: "ns_payments",
      name: "payments (namespace)",
      score: 72,
      gaps: [
        g("pc", "Policy coverage per namespace", "fail", "Attach missing OPA policies"),
        g("ar", "Audit-log retention", "pass", "Extend audit-log retention to 90d"),
        g("pii", "PII datasets flagged", "pass", "Flag PII datasets"),
        g("rr", "Roles reviewed", "fail", "Run quarterly role review"),
        g("vr", "Violation rate", "fail", "Remediate open policy violations"),
      ],
    },
    {
      asset_id: "ns_data",
      name: "data-platform (namespace)",
      score: 68,
      gaps: [
        g("pc", "Policy coverage per namespace", "fail", "Attach missing OPA policies"),
        g("ar", "Audit-log retention", "pass", "Extend audit-log retention to 90d"),
        g("pii", "PII datasets flagged", "fail", "Flag PII datasets"),
        g("rr", "Roles reviewed", "pass", "Run quarterly role review"),
        g("vr", "Violation rate", "fail", "Remediate open policy violations"),
      ],
    },
    {
      asset_id: "ns_ml",
      name: "ml-platform (namespace)",
      score: 88,
      gaps: [
        g("pc", "Policy coverage per namespace", "pass", "Attach missing OPA policies"),
        g("ar", "Audit-log retention", "pass", "Extend audit-log retention to 90d"),
        g("pii", "PII datasets flagged", "pass", "Flag PII datasets"),
        g("rr", "Roles reviewed", "fail", "Run quarterly role review"),
        g("vr", "Violation rate", "pass", "Remediate open policy violations"),
      ],
    },
    {
      asset_id: "ns_growth",
      name: "growth (namespace)",
      score: 90,
      gaps: [
        g("pc", "Policy coverage per namespace", "pass", "Attach missing OPA policies"),
        g("ar", "Audit-log retention", "pass", "Extend audit-log retention to 90d"),
        g("pii", "PII datasets flagged", "pass", "Flag PII datasets"),
        g("rr", "Roles reviewed", "pass", "Run quarterly role review"),
        g("vr", "Violation rate", "pass", "Remediate open policy violations"),
      ],
    },
  ],
  "data-engineer": [
    {
      asset_id: "pl_1",
      name: "orders_daily_agg + analytics.orders_daily",
      score: 95,
      gaps: [
        g("dq", "DQ check coverage", "pass", "Add data-quality checks"),
        g("ln", "Lineage documented", "pass", "Document lineage"),
        g("sr", "Schema registered", "pass", "Register schema in the schema registry"),
        g("rf", "Refresh set", "pass", "Configure refresh schedule"),
        g("pii", "PII flagged", "pass", "Flag PII columns"),
        g("al", "Access level configured", "pass", "Set dataset access level"),
      ],
    },
    {
      asset_id: "pl_7",
      name: "feature_churn_signals + churn features",
      score: 63,
      gaps: [
        g("dq", "DQ check coverage", "fail", "Add data-quality checks"),
        g("ln", "Lineage documented", "fail", "Document lineage"),
        g("sr", "Schema registered", "pass", "Register schema in the schema registry"),
        g("rf", "Refresh set", "pass", "Configure refresh schedule"),
        g("pii", "PII flagged", "fail", "Flag PII columns"),
        g("al", "Access level configured", "pass", "Set dataset access level"),
      ],
    },
    {
      asset_id: "pl_3",
      name: "payments_reconcile + reconcile dataset",
      score: 74,
      gaps: [
        g("dq", "DQ check coverage", "pass", "Add data-quality checks"),
        g("ln", "Lineage documented", "fail", "Document lineage"),
        g("sr", "Schema registered", "pass", "Register schema in the schema registry"),
        g("rf", "Refresh set", "pass", "Configure refresh schedule"),
        g("pii", "PII flagged", "fail", "Flag PII columns"),
        g("al", "Access level configured", "pass", "Set dataset access level"),
      ],
    },
    {
      asset_id: "fg_activity",
      name: "customer_activity feature group",
      score: 87,
      gaps: [
        g("dq", "DQ check coverage", "pass", "Add data-quality checks"),
        g("ln", "Lineage documented", "pass", "Document lineage"),
        g("sr", "Schema registered", "fail", "Register schema in the schema registry"),
        g("rf", "Refresh set", "pass", "Configure refresh schedule"),
        g("pii", "PII flagged", "pass", "Flag PII columns"),
        g("al", "Access level configured", "pass", "Set dataset access level"),
      ],
    },
  ],
};

export async function getScorecards(personaId: string): Promise<Scorecard[]> {
  await delay();
  return SCORECARDS[personaId] ?? [];
}

export interface ScorecardSummary {
  org_score: number;
  by_team: { team: string; score: number; violations: number }[];
}

/** Security-only: org-wide posture score + per-team breakdown. */
export async function getScorecardSummary(): Promise<ScorecardSummary> {
  await delay(200);
  return {
    org_score: 80,
    by_team: [
      { team: "payments", score: 72, violations: 6 },
      { team: "data-platform", score: 68, violations: 8 },
      { team: "ml-platform", score: 88, violations: 1 },
      { team: "growth", score: 90, violations: 0 },
      { team: "commerce", score: 79, violations: 3 },
    ],
  };
}
