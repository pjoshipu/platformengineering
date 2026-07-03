import { delay, minutesAgo, hoursAgo, daysAgo, uid } from "../../api/client";

/**
 * Capability 3.3 — Pipeline Orchestration (persona-parameterized mock).
 *
 * ONE orchestration screen, persona-aware: `getPipelines(persona)` returns the
 * pipelines that persona triggers/monitors, and `getRun(persona, pipelineId)`
 * returns a plausible step sequence (with logs and gates) for the shared
 * run-detail view. Write endpoints (`triggerPipeline`, `abortRun`,
 * `decideGate`) return plausible status/id objects for optimistic toasts.
 */

export interface Pipeline {
  id: string;
  name: string;
  type: string;
  status: "Running" | "Success" | "Failed" | "Queued";
  last_run: string;
  next_run?: string;
}

export interface RunStep {
  idx: number;
  name: string;
  status: "success" | "running" | "failed" | "pending" | "waiting";
  log?: string;
  gate?: boolean;
}

const PIPELINES: Record<string, Pipeline[]> = {
  "ai-engineer": [
    { id: "pl_llm_deploy", name: "support-rag deploy", type: "LLM app deploy", status: "Running", last_run: minutesAgo(4) },
    { id: "pl_canary", name: "support-rag canary → prod", type: "Canary promotion", status: "Running", last_run: minutesAgo(9) },
    { id: "pl_prompt_eval", name: "support-prompts eval", type: "Prompt eval", status: "Success", last_run: hoursAgo(3) },
    { id: "pl_guardrail", name: "guardrail regression", type: "Guardrail test", status: "Failed", last_run: hoursAgo(6) },
    { id: "pl_docs_deploy", name: "docs-assistant deploy", type: "LLM app deploy", status: "Success", last_run: daysAgo(1) },
  ],
  "agentic-engineer": [
    { id: "pl_agent_deploy", name: "support-triage-agent deploy", type: "Agent deploy", status: "Success", last_run: minutesAgo(18) },
    { id: "pl_sandbox_eval", name: "infra-remediation sandbox eval", type: "Sandbox eval", status: "Running", last_run: minutesAgo(3) },
    { id: "pl_run_trace", name: "release-captain run", type: "Run trace", status: "Queued", last_run: minutesAgo(30) },
    { id: "pl_agent_promote", name: "support-triage-agent → prod", type: "Agent deploy", status: "Failed", last_run: hoursAgo(2) },
  ],
  "data-scientist": [
    { id: "pl_train_churn", name: "churn-predictor training", type: "Model training", status: "Running", last_run: minutesAgo(11) },
    { id: "pl_eval_fraud", name: "fraud-detection evaluation", type: "Evaluation", status: "Success", last_run: hoursAgo(4) },
    { id: "pl_promote_churn", name: "churn-predictor promotion", type: "Model promotion", status: "Queued", last_run: hoursAgo(1) },
    { id: "pl_train_recsys", name: "recsys-tower training", type: "Model training", status: "Failed", last_run: hoursAgo(9) },
  ],
  "app-engineer": [
    { id: "pl_svc_deploy", name: "checkout-api deploy", type: "Service deploy", status: "Success", last_run: minutesAgo(22) },
    { id: "pl_infra_provision", name: "inventory-svc infra provision", type: "Infra provisioning", status: "Running", last_run: minutesAgo(5) },
    { id: "pl_gitops_sync", name: "notifications GitOps sync", type: "GitOps sync", status: "Running", last_run: minutesAgo(2) },
    { id: "pl_gw_deploy", name: "payments-gateway deploy", type: "Service deploy", status: "Failed", last_run: hoursAgo(3) },
  ],
  mlops: [
    { id: "pl_sched_churn", name: "churn-training (0 */6 * * *)", type: "Scheduled training", status: "Success", last_run: hoursAgo(3), next_run: hoursAgo(-3) },
    { id: "pl_drift_eval", name: "churn drift evaluation", type: "Drift evaluation", status: "Running", last_run: hoursAgo(2), next_run: hoursAgo(-1) },
    { id: "pl_retrain", name: "churn auto-retrain (drift>0.60)", type: "Retraining trigger", status: "Queued", last_run: minutesAgo(40) },
    { id: "pl_sched_ltv", name: "ltv-training (@daily)", type: "Scheduled training", status: "Failed", last_run: daysAgo(1), next_run: hoursAgo(-13) },
  ],
  security: [
    { id: "pl_policy_deploy", name: "require-resource-limits rollout", type: "Policy deploy", status: "Running", last_run: minutesAgo(7) },
    { id: "pl_compliance_scan", name: "org compliance scan", type: "Compliance scan", status: "Running", last_run: minutesAgo(14) },
    { id: "pl_audit_export", name: "SOC2 audit export", type: "Audit export", status: "Success", last_run: hoursAgo(5) },
    { id: "pl_cve_scan", name: "checkout-api CVE scan", type: "Compliance scan", status: "Failed", last_run: hoursAgo(2) },
  ],
  "data-engineer": [
    { id: "pl_etl_orders", name: "orders_daily_agg", type: "ETL/ELT", status: "Success", last_run: hoursAgo(6), next_run: hoursAgo(-18) },
    { id: "pl_feature_churn", name: "feature_churn_signals", type: "Feature computation", status: "Failed", last_run: hoursAgo(7), next_run: hoursAgo(-17) },
    { id: "pl_dq_orders", name: "orders data quality", type: "Data quality", status: "Running", last_run: minutesAgo(6) },
    { id: "pl_publish_orders", name: "analytics.orders_daily publish", type: "Dataset publish", status: "Queued", last_run: hoursAgo(6) },
  ],
};

/** Persona-keyed step sequences for the shared run-detail view. */
const RUNS: Record<string, Record<string, RunStep[]>> = {
  "ai-engineer": {
    pl_llm_deploy: [
      { idx: 1, name: "Build container", status: "success", log: "image support-rag:v1.4.1 pushed (312MB)" },
      { idx: 2, name: "Run prompt eval suite", status: "success", log: "faithfulness 0.94 · 48/48 cases passed" },
      { idx: 3, name: "Deploy to staging", status: "success", log: "rollout complete, 3/3 pods ready" },
      { idx: 4, name: "Promotion gate", status: "waiting", gate: true, log: "awaiting approval to promote to prod" },
      { idx: 5, name: "Deploy to prod", status: "pending" },
    ],
    pl_canary: [
      { idx: 1, name: "Route 10% traffic to canary", status: "success", log: "canary v2.1.4 receiving 10% of requests" },
      { idx: 2, name: "Observe latency & error rate", status: "running", log: "p95 412ms · error rate 0.3%" },
      { idx: 3, name: "Canary promotion gate", status: "waiting", gate: true, log: "hold: awaiting approval to go 100%" },
      { idx: 4, name: "Shift 100% traffic", status: "pending" },
    ],
    pl_prompt_eval: [
      { idx: 1, name: "Load eval dataset", status: "success", log: "support-eval-v12 · 120 cases" },
      { idx: 2, name: "Run graded eval", status: "success", log: "faithfulness 0.94 · relevance 0.91" },
      { idx: 3, name: "Publish scorecard", status: "success", log: "scorecard #4821 published" },
    ],
    pl_guardrail: [
      { idx: 1, name: "Load guardrail cases", status: "success", log: "58 adversarial prompts" },
      { idx: 2, name: "Run PII/jailbreak checks", status: "failed", log: "2 jailbreak bypasses detected in v1.4.1" },
      { idx: 3, name: "Report", status: "pending" },
    ],
    pl_docs_deploy: [
      { idx: 1, name: "Build container", status: "success", log: "image docs-assistant:v2.1.3 pushed" },
      { idx: 2, name: "Run prompt eval suite", status: "success", log: "faithfulness 0.91 · passed" },
      { idx: 3, name: "Deploy to prod", status: "success", log: "rollout complete" },
    ],
  },
  "agentic-engineer": {
    pl_agent_deploy: [
      { idx: 1, name: "Package agent bundle", status: "success", log: "runtime: Claude Agent SDK · 5 tools" },
      { idx: 2, name: "Validate tool permissions", status: "success", log: "all 5 tools within autonomy budget" },
      { idx: 3, name: "Deploy to sandbox", status: "success", log: "agent live in sandbox tenant" },
    ],
    pl_sandbox_eval: [
      { idx: 1, name: "Spin up sandbox", status: "success", log: "isolated tenant provisioned" },
      { idx: 2, name: "Run scenario suite", status: "running", log: "12/20 scenarios · success rate 88%" },
      { idx: 3, name: "Checkpoint gate", status: "waiting", gate: true, log: "awaiting approval before prod rollout" },
      { idx: 4, name: "Promote to prod", status: "pending" },
    ],
    pl_run_trace: [
      { idx: 1, name: "Plan", status: "success", log: "goal decomposed into 6 steps" },
      { idx: 2, name: "Act — call tools", status: "running", log: "k8s.rollout_restart invoked" },
      { idx: 3, name: "Observe & replan", status: "pending" },
    ],
    pl_agent_promote: [
      { idx: 1, name: "Package agent bundle", status: "success", log: "runtime: Claude Agent SDK" },
      { idx: 2, name: "Run scenario suite", status: "failed", log: "success rate 72% below 90% threshold" },
      { idx: 3, name: "Checkpoint gate", status: "pending", gate: true },
    ],
  },
  "data-scientist": {
    pl_train_churn: [
      { idx: 1, name: "Fetch training data", status: "success", log: "customer-churn-2026 · 1.2M rows" },
      { idx: 2, name: "Train (XGBoost)", status: "running", log: "epoch 8/12 · AUC 0.887" },
      { idx: 3, name: "Evaluate", status: "pending" },
      { idx: 4, name: "Promotion gate", status: "waiting", gate: true, log: "awaiting approve/reject to registry" },
    ],
    pl_eval_fraud: [
      { idx: 1, name: "Load candidate model", status: "success", log: "fraud-detection v7 (PyTorch)" },
      { idx: 2, name: "Run holdout eval", status: "success", log: "AUC 0.947 · precision 0.91" },
      { idx: 3, name: "Compare to prod", status: "success", log: "+0.012 AUC vs current prod" },
    ],
    pl_promote_churn: [
      { idx: 1, name: "Validate model card", status: "success", log: "card complete · lineage attached" },
      { idx: 2, name: "Bias & fairness check", status: "success", log: "no disparate impact flagged" },
      { idx: 3, name: "Promotion gate", status: "waiting", gate: true, log: "awaiting approve/reject → prod" },
      { idx: 4, name: "Register in prod", status: "pending" },
    ],
    pl_train_recsys: [
      { idx: 1, name: "Fetch training data", status: "success", log: "clickstream-90d · 40M events" },
      { idx: 2, name: "Train (TensorFlow)", status: "failed", log: "OOM on gpu-a100 at epoch 3" },
      { idx: 3, name: "Evaluate", status: "pending" },
    ],
  },
  "app-engineer": {
    pl_svc_deploy: [
      { idx: 1, name: "Build & test", status: "success", log: "unit + integration green" },
      { idx: 2, name: "Provision resources", status: "success", log: "Score spec parsed · limits applied" },
      { idx: 3, name: "GitOps sync", status: "success", log: "argocd synced to cluster" },
      { idx: 4, name: "Health check", status: "success", log: "3/3 pods healthy · /healthz 200" },
    ],
    pl_infra_provision: [
      { idx: 1, name: "Parse Score spec", status: "success", log: "cpu 500m · mem 512Mi · 3 replicas" },
      { idx: 2, name: "Provision namespace & quota", status: "running", log: "applying resource quota" },
      { idx: 3, name: "Commit manifests to GitOps", status: "pending" },
    ],
    pl_gitops_sync: [
      { idx: 1, name: "Detect drift", status: "success", log: "2 resources out of sync" },
      { idx: 2, name: "Apply desired state", status: "running", log: "reconciling deployment/notifications" },
      { idx: 3, name: "Verify healthy", status: "pending" },
    ],
    pl_gw_deploy: [
      { idx: 1, name: "Build & test", status: "success", log: "green" },
      { idx: 2, name: "GitOps sync", status: "failed", log: "readiness probe failing · rollback recommended" },
      { idx: 3, name: "Health check", status: "pending" },
    ],
  },
  mlops: {
    pl_sched_churn: [
      { idx: 1, name: "Trigger scheduled run", status: "success", log: "cron 0 */6 * * * fired" },
      { idx: 2, name: "Train on gpu-a100", status: "success", log: "AUC 0.891 · 42min" },
      { idx: 3, name: "Register candidate", status: "success", log: "churn-predictor v41 registered" },
    ],
    pl_drift_eval: [
      { idx: 1, name: "Pull recent traffic", status: "success", log: "last 24h · 84K predictions" },
      { idx: 2, name: "Compute drift (PSI)", status: "running", log: "PSI 0.71 · CRITICAL" },
      { idx: 3, name: "Retrain decision gate", status: "waiting", gate: true, log: "drift>0.60 · awaiting approval to auto-retrain" },
      { idx: 4, name: "Kick retraining", status: "pending" },
    ],
    pl_retrain: [
      { idx: 1, name: "Snapshot fresh data", status: "success", log: "customer-churn-2026 refreshed" },
      { idx: 2, name: "Retrain", status: "pending" },
      { idx: 3, name: "Promotion gate", status: "waiting", gate: true, log: "awaiting approval to swap serving model" },
    ],
    pl_sched_ltv: [
      { idx: 1, name: "Trigger scheduled run", status: "success", log: "@daily fired" },
      { idx: 2, name: "Train on gpu-a100", status: "failed", log: "feature table stale · upstream ETL failed" },
      { idx: 3, name: "Register candidate", status: "pending" },
    ],
  },
  security: {
    pl_policy_deploy: [
      { idx: 1, name: "Lint OPA bundle", status: "success", log: "require-resource-limits.rego · 0 errors" },
      { idx: 2, name: "Dry-run against cluster", status: "success", log: "4 would-be violations found" },
      { idx: 3, name: "Enforcement rollout gate", status: "waiting", gate: true, log: "awaiting approval to enforce (deny mode)" },
      { idx: 4, name: "Enable enforcement", status: "pending" },
    ],
    pl_compliance_scan: [
      { idx: 1, name: "Enumerate assets", status: "success", log: "312 assets in scope" },
      { idx: 2, name: "Evaluate policies", status: "running", log: "218/312 scanned · 11 non-compliant" },
      { idx: 3, name: "Publish report", status: "pending" },
    ],
    pl_audit_export: [
      { idx: 1, name: "Collect audit logs", status: "success", log: "90d window · 1.4M events" },
      { idx: 2, name: "Redact & package", status: "success", log: "PII redacted · export signed" },
      { idx: 3, name: "Deliver to evidence store", status: "success", log: "SOC2-2026-Q3.zip uploaded" },
    ],
    pl_cve_scan: [
      { idx: 1, name: "Pull image SBOM", status: "success", log: "checkout-api:v3.2.0" },
      { idx: 2, name: "Scan CVEs", status: "failed", log: "2 CRITICAL (CVE-2026-1337) · 5 HIGH" },
      { idx: 3, name: "Remediation gate", status: "pending", gate: true },
    ],
  },
  "data-engineer": {
    pl_etl_orders: [
      { idx: 1, name: "Extract from source", status: "success", log: "postgres.orders · 480K rows" },
      { idx: 2, name: "Transform & aggregate", status: "success", log: "daily rollup computed" },
      { idx: 3, name: "Data quality gate", status: "waiting", gate: true, log: "quality 98% · skip requires typed reason" },
      { idx: 4, name: "Load to warehouse", status: "pending" },
    ],
    pl_feature_churn: [
      { idx: 1, name: "Extract upstream", status: "success", log: "customer_activity · hourly" },
      { idx: 2, name: "Compute features", status: "failed", log: "null rate 37% on tenure_days" },
      { idx: 3, name: "Data quality gate", status: "waiting", gate: true, log: "quality 63% below 90% · skip requires typed reason" },
      { idx: 4, name: "Publish feature group", status: "pending" },
    ],
    pl_dq_orders: [
      { idx: 1, name: "Load candidate dataset", status: "success", log: "analytics.orders_daily" },
      { idx: 2, name: "Run expectations suite", status: "running", log: "34/40 checks · 6 pending" },
      { idx: 3, name: "Score & report", status: "pending" },
    ],
    pl_publish_orders: [
      { idx: 1, name: "Validate schema", status: "success", log: "schema matches contract v3" },
      { idx: 2, name: "Data quality gate", status: "waiting", gate: true, log: "awaiting quality sign-off · skip requires typed reason" },
      { idx: 3, name: "Publish to catalog", status: "pending" },
    ],
  },
};

export async function getPipelines(personaId: string): Promise<Pipeline[]> {
  await delay();
  return PIPELINES[personaId] ?? [];
}

export async function getRun(
  personaId: string,
  pipelineId: string
): Promise<{ pipeline: Pipeline | undefined; steps: RunStep[] }> {
  await delay();
  const pipeline = (PIPELINES[personaId] ?? []).find((p) => p.id === pipelineId);
  const steps = RUNS[personaId]?.[pipelineId] ?? [];
  return { pipeline, steps };
}

export async function triggerPipeline(id: string): Promise<{ status: string; run_id: string }> {
  await delay();
  return { status: "Running", run_id: uid("run") };
}

export async function abortRun(id: string): Promise<{ status: string }> {
  await delay();
  return { status: "Aborted" };
}

export async function decideGate(
  id: string,
  decision: "approve" | "reject",
  reason?: string
): Promise<{ status: string; run_id: string }> {
  await delay();
  return { status: decision === "approve" ? "Approved" : "Rejected", run_id: uid("run") };
}
