import { delay } from "../../api/client";

/**
 * Capability 1.2 — Curated Templates (persona-parameterized mock).
 *
 * ONE library of pre-approved scaffolds, persona-aware: `getTemplates(persona, …)`
 * returns the template categories, tags, and preview fields relevant to that
 * persona. `preview` holds the persona-specific summary fields; the screen
 * renders them from a per-persona preview config in Templates.tsx.
 * `getTemplate(persona, id)` adds a readme and an example config snippet.
 */

export interface Template {
  id: string;
  name: string;
  category: string;
  tags: string[];
  version: string;
  approved: boolean;
  /** persona-specific preview fields, keyed by the preview config in Templates.tsx */
  preview: Record<string, string>;
}

export interface TemplateFilters {
  q?: string;
  category?: string; // "all" or a persona category
}

export interface TemplateDetail extends Template {
  readme: string;
  config: string;
}

const TEMPLATES: Record<string, Template[]> = {
  "ai-engineer": [
    { id: "tpl_rag", name: "RAG pipeline starter", category: "RAG pipeline", tags: ["retrieval", "vector-store", "citations"], version: "v2.3.0", approved: true, preview: { guardrails: "PII redaction, prompt-injection filter, groundedness check", providers: "OpenAI, Anthropic, Azure OpenAI", est_cost: "~$0.011 / query" } },
    { id: "tpl_llm_wrap", name: "LLM API wrapper", category: "LLM API wrapper", tags: ["gateway", "retries", "fallback"], version: "v1.6.2", approved: true, preview: { guardrails: "Rate limit, cost cap, output length guard", providers: "OpenAI, Anthropic, Bedrock", est_cost: "~$0.004 / call" } },
    { id: "tpl_agent_svc", name: "Agent-service scaffold", category: "Agent-service scaffold", tags: ["tools", "fastapi", "observability"], version: "v1.2.0", approved: true, preview: { guardrails: "Tool allow-list, action approval, output moderation", providers: "OpenAI, Anthropic", est_cost: "~$0.09 / session" } },
    { id: "tpl_guardrail", name: "Guardrail policy set", category: "Guardrail policy set", tags: ["safety", "moderation", "pii"], version: "v3.0.1", approved: true, preview: { guardrails: "8 policies: jailbreak, PII, toxicity, topic, secrets…", providers: "Provider-agnostic", est_cost: "~$0.001 / eval" } },
    { id: "tpl_prompt_lib", name: "Prompt template library", category: "Prompt template library", tags: ["prompts", "versioning", "eval"], version: "v12", approved: true, preview: { guardrails: "Prompt-injection lint on save", providers: "OpenAI, Anthropic", est_cost: "n/a" } },
  ],
  "agentic-engineer": [
    { id: "tpl_agent_sdk", name: "Agent scaffold (Claude Agent SDK)", category: "Agent scaffold", tags: ["claude-agent-sdk", "tools", "loop"], version: "v2.1.0", approved: true, preview: { runtime: "Claude Agent SDK", tools: "read_docs, run_query, http_get (read-only scopes)", autonomy: "Medium — propose then act", hitl: "Approval before any write action" } },
    { id: "tpl_agent_lg", name: "Agent scaffold (LangGraph)", category: "Agent scaffold", tags: ["langgraph", "state-machine", "tools"], version: "v1.4.3", approved: true, preview: { runtime: "LangGraph", tools: "search, calculator, code_exec (sandboxed)", autonomy: "Low — single-step", hitl: "Approval every step" } },
    { id: "tpl_tool_bind", name: "Tool-binding preset", category: "Tool-binding preset", tags: ["tools", "scopes", "mcp"], version: "v1.1.0", approved: true, preview: { runtime: "Runtime-agnostic", tools: "k8s.rollout_restart (cluster:write), pagerduty.ack", autonomy: "n/a", hitl: "Write tools gated by approval" } },
    { id: "tpl_autonomy", name: "Autonomy-policy preset", category: "Autonomy-policy preset", tags: ["autonomy", "budget", "policy"], version: "v1.0.2", approved: true, preview: { runtime: "Runtime-agnostic", tools: "n/a", autonomy: "Budget: 20 steps, $5/run cap", hitl: "Escalate on budget breach" } },
    { id: "tpl_hitl", name: "HITL checkpoint set", category: "HITL checkpoint set", tags: ["human-in-the-loop", "approvals"], version: "v1.3.0", approved: true, preview: { runtime: "Runtime-agnostic", tools: "n/a", autonomy: "n/a", hitl: "Checkpoints: pre-write, pre-spend, on-error" } },
    { id: "tpl_eval_pack", name: "Eval-scenario pack", category: "Eval-scenario pack", tags: ["eval", "scenarios", "regression"], version: "v0.9.0", approved: false, preview: { runtime: "Runtime-agnostic", tools: "n/a", autonomy: "n/a", hitl: "n/a — 24 scenarios, pass@k scoring" } },
  ],
  "data-scientist": [
    { id: "tpl_train_xgb", name: "Training-job config (XGBoost)", category: "Training-job config", tags: ["xgboost", "tabular", "gpu"], version: "v1.5.0", approved: true, preview: { framework: "XGBoost 2.0", hyperparameters: "max_depth=6, eta=0.1, n_estimators=500", quality_checks: "AUC gate ≥ 0.85, calibration, leakage scan", dataset: "gs://ds-datasets/customer-churn-2026/" } },
    { id: "tpl_train_torch", name: "Training-job config (PyTorch)", category: "Training-job config", tags: ["pytorch", "gpu", "ddp"], version: "v2.0.1", approved: true, preview: { framework: "PyTorch 2.3", hyperparameters: "lr=3e-4, batch=256, epochs=30, opt=adamw", quality_checks: "loss plateau, grad-norm, overfit alert", dataset: "gs://ds-datasets/txn-fraud-labeled/" } },
    { id: "tpl_notebook", name: "Experiment notebook", category: "Experiment notebook", tags: ["notebook", "mlflow", "reproducible"], version: "v1.2.0", approved: true, preview: { framework: "Framework-agnostic", hyperparameters: "templated params cell", quality_checks: "seed pinning, env capture, MLflow autolog", dataset: "parametrised path" } },
    { id: "tpl_serving", name: "Model-serving Score spec", category: "Model-serving Score spec", tags: ["score", "serving", "autoscale"], version: "v1.0.0", approved: true, preview: { framework: "Score / KServe", hyperparameters: "n/a", quality_checks: "shadow test, latency SLO, canary", dataset: "n/a" } },
    { id: "tpl_eval_report", name: "Eval report structure", category: "Eval report structure", tags: ["evaluation", "report", "fairness"], version: "v1.1.0", approved: true, preview: { framework: "Framework-agnostic", hyperparameters: "n/a", quality_checks: "metrics table, slice analysis, fairness", dataset: "held-out test set" } },
  ],
  "app-engineer": [
    { id: "tpl_score_api", name: "Score spec — REST API service", category: "Score-spec scaffold", tags: ["score", "rest", "http"], version: "v1.4.0", approved: true, preview: { dependencies: "postgres, redis, kong-route", environments: "dev, staging, prod", example: "score.yaml (see preview)", provisioning: "~4 min" } },
    { id: "tpl_score_worker", name: "Score spec — background worker", category: "Score-spec scaffold", tags: ["score", "worker", "queue"], version: "v1.3.1", approved: true, preview: { dependencies: "rabbitmq, postgres", environments: "dev, staging, prod", example: "score.yaml (see preview)", provisioning: "~3 min" } },
    { id: "tpl_xplane", name: "Crossplane resource claim", category: "Crossplane resource claim", tags: ["crossplane", "iac", "managed"], version: "v2.0.0", approved: true, preview: { dependencies: "cloud-sql, gcs-bucket", environments: "staging, prod", example: "claim.yaml (see preview)", provisioning: "~8 min" } },
    { id: "tpl_kong", name: "Kong route config", category: "Kong route config", tags: ["kong", "gateway", "routing"], version: "v1.2.0", approved: true, preview: { dependencies: "kong-gateway", environments: "dev, staging, prod", example: "kong-route.yaml (see preview)", provisioning: "~1 min" } },
    { id: "tpl_gitops", name: "GitOps folder structure", category: "GitOps folder structure", tags: ["argocd", "gitops", "kustomize"], version: "v1.0.3", approved: true, preview: { dependencies: "argocd", environments: "base + dev/staging/prod overlays", example: "tree layout (see preview)", provisioning: "instant" } },
  ],
  mlops: [
    { id: "tpl_dag", name: "Pipeline DAG starter", category: "Pipeline DAG starter", tags: ["airflow", "dag", "training"], version: "v1.7.0", approved: true, preview: { compute: "gpu-a100 (train), cpu-4x (prep)", alert_thresholds: "SLA miss > 30m, retries=2", model_types: "XGBoost, PyTorch, TensorFlow" } },
    { id: "tpl_drift", name: "Drift-monitor config", category: "Drift-monitor config", tags: ["drift", "monitoring", "psi"], version: "v1.3.2", approved: true, preview: { compute: "cpu-2x hourly", alert_thresholds: "PSI > 0.20 warn, > 0.60 critical", model_types: "Tabular, embedding" } },
    { id: "tpl_retrain", name: "Retraining-rule preset", category: "Retraining-rule preset", tags: ["retraining", "automation", "policy"], version: "v1.1.0", approved: true, preview: { compute: "inherits training job", alert_thresholds: "drift > 0.60 auto, AUC drop > 3%", model_types: "Any registered model" } },
    { id: "tpl_infra_size", name: "Infra sizing guide", category: "Infra sizing guide", tags: ["sizing", "gpu", "cost"], version: "v2.0.0", approved: true, preview: { compute: "a100 / a10g / cpu tiers", alert_thresholds: "util < 40% rightsizing flag", model_types: "LLM, vision, tabular" } },
    { id: "tpl_serving_mon", name: "Serving monitor config", category: "Drift-monitor config", tags: ["serving", "latency", "slo"], version: "v0.8.1", approved: false, preview: { compute: "sidecar", alert_thresholds: "p95 > 400ms, error > 1%", model_types: "Online endpoints" } },
  ],
  security: [
    { id: "tpl_opa_limits", name: "OPA — require resource limits", category: "OPA policy template", tags: ["opa", "rego", "k8s"], version: "v1.4.0", approved: true, preview: { enforcement: "deny (block admission)", scope: "namespace | cluster | org", test_sample: "included — pass & fail fixtures" } },
    { id: "tpl_opa_registry", name: "OPA — restrict registries", category: "OPA policy template", tags: ["opa", "rego", "supply-chain"], version: "v1.2.1", approved: true, preview: { enforcement: "deny (block admission)", scope: "cluster | org", test_sample: "included — allowed/denied images" } },
    { id: "tpl_opa_priv", name: "OPA — block privileged containers", category: "OPA policy template", tags: ["opa", "rego", "hardening"], version: "v1.3.0", approved: true, preview: { enforcement: "deny (block admission)", scope: "namespace | cluster", test_sample: "included — privileged pod fixture" } },
    { id: "tpl_opa_labels", name: "OPA — require labels", category: "OPA policy template", tags: ["opa", "rego", "governance"], version: "v1.1.0", approved: true, preview: { enforcement: "warn (audit only)", scope: "namespace | cluster | org", test_sample: "included — missing-label fixture" } },
    { id: "tpl_audit_fmt", name: "Audit report format", category: "Audit report format", tags: ["audit", "compliance", "report"], version: "v1.0.2", approved: true, preview: { enforcement: "n/a — reporting", scope: "org", test_sample: "included — sample SOC2 export" } },
  ],
  "data-engineer": [
    { id: "tpl_dag_batch", name: "Pipeline DAG — batch (JDBC source)", category: "Pipeline DAG starter", tags: ["airflow", "jdbc", "batch"], version: "v1.6.0", approved: true, preview: { source_compat: "Postgres, MySQL, SQL Server", quality_checks: "row-count, null-rate, freshness", output_format: "Parquet → BigQuery" } },
    { id: "tpl_dag_stream", name: "Pipeline DAG — streaming (Kafka source)", category: "Pipeline DAG starter", tags: ["kafka", "streaming", "beam"], version: "v1.2.0", approved: true, preview: { source_compat: "Kafka, PubSub, Kinesis", quality_checks: "schema-drift, dedup, watermark lag", output_format: "Avro → BigQuery" } },
    { id: "tpl_dq_bundle", name: "Data-quality check bundle", category: "Data-quality check bundle", tags: ["great-expectations", "quality", "tests"], version: "v2.0.1", approved: true, preview: { source_compat: "Any tabular source", quality_checks: "18 expectations: nulls, ranges, uniqueness…", output_format: "GE data docs + JSON" } },
    { id: "tpl_schema", name: "Dataset schema template", category: "Dataset schema template", tags: ["schema", "contract", "governance"], version: "v1.1.0", approved: true, preview: { source_compat: "BigQuery, Snowflake", quality_checks: "type + nullability contract", output_format: "table schema (JSON)" } },
    { id: "tpl_feature_grp", name: "Feature-group scaffold", category: "Feature-group scaffold", tags: ["feature-store", "features", "online"], version: "v1.0.0", approved: true, preview: { source_compat: "Offline (BQ) + online (Redis)", quality_checks: "freshness, ttl, backfill validation", output_format: "Feature group (online/offline)" } },
  ],
};

const READMES: Record<string, string> = {
  "ai-engineer":
    "Pre-approved scaffold for GenAI workloads. Ships with the platform guardrail set wired in, a provider-agnostic gateway, and cost tracking on every call. Fork it, point it at your data source, and the CI eval gate will run automatically on first push.",
  "agentic-engineer":
    "Pre-approved agent scaffold with tool bindings, an autonomy budget, and human-in-the-loop checkpoints pre-configured. Write actions are gated by approval out of the box; loosen autonomy only after the eval-scenario pack passes.",
  "data-scientist":
    "Reproducible training scaffold with pinned seeds, MLflow autologging, and quality gates baked in. Edit the hyperparameters block, submit, and the platform provisions compute and registers the run automatically.",
  "app-engineer":
    "Paved-road service scaffold. The Score spec declares your dependencies; Crossplane provisions them and ArgoCD syncs the GitOps folder. Deploy directly to the dev environment or save as a draft PR.",
  mlops:
    "Production ML operations scaffold. Wire the DAG to your model, attach the drift monitor, and set retraining rules. Compute defaults and alert thresholds follow the platform's paved road so no infra ticket is needed.",
  security:
    "Pre-approved OPA policy template with bundled test fixtures. Review the Rego, set the enforcement action and scope, then deploy to the admission controller. All templates ship with pass/fail test samples so you can validate before enforcing.",
  "data-engineer":
    "Data pipeline scaffold with source connectors, a data-quality check bundle, and a published output contract. Fork it, point it at your source, and the quality gate runs on every scheduled run.",
};

const CONFIGS: Record<string, string> = {
  "ai-engineer": `# rag-pipeline.yaml
name: support-rag
provider: openai
model: gpt-4o-mini
retriever:
  vector_store: pgvector
  top_k: 6
guardrails:
  - pii_redaction
  - prompt_injection_filter
  - groundedness_check
eval:
  gate: faithfulness >= 0.90`,
  "agentic-engineer": `# agent.yaml
runtime: claude-agent-sdk
model: claude-3.5-sonnet
tools:
  - name: read_docs
    scope: read-only
  - name: run_query
    scope: read-only
autonomy:
  level: medium
  budget: { steps: 20, usd: 5 }
hitl:
  checkpoints: [pre_write, pre_spend, on_error]`,
  "data-scientist": `# training-job.yaml
framework: xgboost
dataset: gs://ds-datasets/customer-churn-2026/
params:
  max_depth: 6
  eta: 0.1
  n_estimators: 500
quality_gates:
  - metric: auc
    min: 0.85
  - check: leakage_scan
compute: gpu-a100`,
  "app-engineer": `# score.yaml
apiVersion: score.dev/v1b1
metadata:
  name: checkout-api
containers:
  main:
    image: org/checkout-api:latest
resources:
  db:
    type: postgres
  cache:
    type: redis
  route:
    type: kong-route
    params: { path: /api/checkout }`,
  mlops: `# pipeline-dag.yaml
dag_id: churn_training
schedule: "0 */6 * * *"
tasks:
  - prep: { compute: cpu-4x }
  - train: { compute: gpu-a100 }
  - eval: { gate: "auc >= 0.85" }
alerts:
  sla_miss_minutes: 30
  retries: 2`,
  security: `# require-resource-limits.rego
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Pod"
  c := input.request.object.spec.containers[_]
  not c.resources.limits.cpu
  msg := sprintf("container %v missing cpu limit", [c.name])
}

# enforcement: deny  scope: namespace|cluster|org`,
  "data-engineer": `# pipeline-dag.yaml
dag_id: orders_daily_agg
schedule: "0 2 * * *"
source:
  type: jdbc
  engine: postgres
quality_checks:
  - row_count
  - null_rate
  - freshness
output:
  format: parquet
  sink: bigquery.analytics.orders_daily`,
};

export async function getTemplates(
  personaId: string,
  filters: TemplateFilters = {}
): Promise<Template[]> {
  await delay();
  const rows = TEMPLATES[personaId] ?? [];
  const q = (filters.q ?? "").trim().toLowerCase();
  return rows.filter(
    (t) =>
      (!q ||
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))) &&
      (!filters.category || filters.category === "all" || t.category === filters.category)
  );
}

export async function getTemplate(
  personaId: string,
  id: string
): Promise<TemplateDetail | undefined> {
  await delay(200);
  const tpl = (TEMPLATES[personaId] ?? []).find((t) => t.id === id);
  if (!tpl) return undefined;
  return {
    ...tpl,
    readme: READMES[personaId] ?? `Pre-approved scaffold "${tpl.name}".`,
    config: CONFIGS[personaId] ?? `# ${tpl.name}\n# example config`,
  };
}
