import { delay, daysAgo, hoursAgo, minutesAgo } from "../../api/client";
import { applyOverrides, normalizeOverrides, type ResourceOverrides } from "../../api/overrides";
import overridesJson from "./catalog-overrides.json";

/**
 * Capability 1.1 — Software Catalogs (persona-parameterized mock).
 *
 * ONE catalog, persona-aware: `getCatalog(persona, …)` returns the asset types
 * and fields relevant to that persona (the "?persona=<id>" contract from
 * IDP_SCREEN_REQUIREMENTS.md). `fields` holds the persona-specific columns; the
 * screen renders them from a per-persona column config. Security sees a
 * cross-persona mix with a compliance column on every row.
 */

export interface CatalogRow {
  id: string;
  name: string;
  type: string;
  owner: string;
  status: string;
  updated_at: string;
  /** persona-specific display values, keyed by the column config in Catalog.tsx */
  fields: Record<string, string | number>;
}

export interface CatalogFilters {
  q?: string;
  type?: string; // "all" or a persona type
  status?: string; // "all" or a status
}

const CATALOG: Record<string, CatalogRow[]> = {
  "ai-engineer": [
    { id: "app_1", name: "support-rag", type: "RAG pipeline", owner: "applied-ai", status: "Healthy", updated_at: hoursAgo(5), fields: { model: "gpt-4o-mini", provider: "OpenAI", version: "v1.4.0", guardrails: "5 active", faithfulness: "0.94" } },
    { id: "app_2", name: "docs-assistant", type: "RAG pipeline", owner: "applied-ai", status: "Canary", updated_at: hoursAgo(2), fields: { model: "claude-3.5-sonnet", provider: "Anthropic", version: "v2.1.3", guardrails: "4 active", faithfulness: "0.91" } },
    { id: "app_3", name: "sql-copilot", type: "Agent service", owner: "data-tools", status: "Degraded", updated_at: minutesAgo(24), fields: { model: "gpt-4o", provider: "OpenAI", version: "v3.0.1", guardrails: "3 active", faithfulness: "0.78" } },
    { id: "app_5", name: "kb-embedder", type: "Embedding service", owner: "applied-ai", status: "Healthy", updated_at: daysAgo(3), fields: { model: "text-embedding-3-large", provider: "OpenAI", version: "v1.0.0", guardrails: "1 active", faithfulness: "0.96" } },
    { id: "pr_1", name: "support-prompts", type: "Prompt registry", owner: "applied-ai", status: "Active in prod", updated_at: hoursAgo(6), fields: { model: "—", provider: "—", version: "v12", guardrails: "n/a", faithfulness: "—" } },
  ],
  "agentic-engineer": [
    { id: "ag_1", name: "support-triage-agent", type: "Agent", owner: "autonomous-systems", status: "Healthy", updated_at: minutesAgo(12), fields: { runtime: "Claude Agent SDK", model: "claude-3.5-sonnet", tools: 5, autonomy: "Medium", success: "93%", cost_day: "$34.20" } },
    { id: "ag_2", name: "infra-remediation-agent", type: "Agent", owner: "autonomous-systems", status: "Awaiting approval", updated_at: minutesAgo(6), fields: { runtime: "LangGraph", model: "gpt-4o", tools: 8, autonomy: "Low", success: "88%", cost_day: "$51.70" } },
    { id: "ag_4", name: "release-captain", type: "Agent", owner: "autonomous-systems", status: "Paused", updated_at: hoursAgo(1), fields: { runtime: "Custom (LangChain)", model: "gpt-4o", tools: 10, autonomy: "High", success: "90%", cost_day: "$40.00" } },
    { id: "tl_2", name: "k8s.rollout_restart", type: "Tool", owner: "platform", status: "Healthy", updated_at: daysAgo(1), fields: { runtime: "API", model: "—", tools: 0, autonomy: "cluster:write", success: "—", cost_day: "—" } },
    { id: "rt_1", name: "claude-agent-runtime", type: "Runtime", owner: "autonomous-systems", status: "Healthy", updated_at: daysAgo(4), fields: { runtime: "Claude Agent SDK", model: "—", tools: 0, autonomy: "—", success: "—", cost_day: "—" } },
  ],
  "data-scientist": [
    { id: "mdl_churn", name: "churn-predictor", type: "Model", owner: "ds-team", status: "In prod", updated_at: daysAgo(2), fields: { framework: "XGBoost", best_metric: "AUC 0.891", dataset: "customer-churn-2026", registry_status: "In prod" } },
    { id: "mdl_fraud", name: "fraud-detection", type: "Model", owner: "ds-team", status: "In staging", updated_at: hoursAgo(7), fields: { framework: "PyTorch", best_metric: "AUC 0.947", dataset: "txn-fraud-labeled", registry_status: "In staging" } },
    { id: "exp_recsys", name: "recsys-tower", type: "Experiment", owner: "ds-team", status: "Pending approval", updated_at: hoursAgo(9), fields: { framework: "TensorFlow", best_metric: "AUC 0.906", dataset: "clickstream-90d", registry_status: "Pending approval" } },
    { id: "fg_activity", name: "customer_activity", type: "Feature group", owner: "ml-platform", status: "Healthy", updated_at: minutesAgo(18), fields: { framework: "—", best_metric: "—", dataset: "crm.customer_360", registry_status: "—" } },
    { id: "ds_churn", name: "customer-churn-2026", type: "Dataset", owner: "data-platform", status: "Restricted", updated_at: daysAgo(1), fields: { framework: "—", best_metric: "—", dataset: "—", registry_status: "—" } },
  ],
  "app-engineer": [
    { id: "svc_1", name: "checkout-api", type: "Service", owner: "payments", status: "Healthy", updated_at: hoursAgo(5), fields: { env: "prod", sync: "Synced", health: "Healthy", repo: "org/checkout-api", route: "/api/checkout" } },
    { id: "svc_3", name: "inventory-svc", type: "Service", owner: "commerce", status: "Degraded", updated_at: hoursAgo(2), fields: { env: "staging", sync: "Out of sync", health: "Degraded", repo: "org/inventory-svc", route: "/api/inventory" } },
    { id: "svc_4", name: "notifications", type: "Service", owner: "growth", status: "Progressing", updated_at: minutesAgo(18), fields: { env: "prod", sync: "Synced", health: "Progressing", repo: "org/notifications", route: "/api/notify" } },
    { id: "svc_2", name: "payments-gateway", type: "API", owner: "payments", status: "Healthy", updated_at: daysAgo(1), fields: { env: "prod", sync: "Synced", health: "Healthy", repo: "org/payments-gateway", route: "/api/payments" } },
  ],
  mlops: [
    { id: "pl_1", name: "churn-training", type: "Pipeline", owner: "ml-platform", status: "Success", updated_at: hoursAgo(3), fields: { schedule: "0 */6 * * *", last_run: "3h ago", drift: "Critical", rule: "drift>0.60 auto", compute: "gpu-a100" } },
    { id: "pl_4", name: "ltv-training", type: "Pipeline", owner: "ml-platform", status: "Failed", updated_at: daysAgo(1), fields: { schedule: "@daily", last_run: "1d ago", drift: "Warning", rule: "manual only", compute: "gpu-a100" } },
    { id: "ep_churn", name: "churn-serving", type: "Serving endpoint", owner: "ml-platform", status: "Ready", updated_at: daysAgo(2), fields: { schedule: "—", last_run: "—", drift: "—", rule: "—", compute: "cpu-4x" } },
    { id: "dm_churn", name: "churn-drift-monitor", type: "Drift monitor", owner: "ml-platform", status: "Warning", updated_at: hoursAgo(2), fields: { schedule: "hourly", last_run: "2h ago", drift: "0.71", rule: "rl_1", compute: "—" } },
  ],
  security: [
    { id: "svc_1", name: "checkout-api", type: "Service", owner: "payments", status: "Non-compliant", updated_at: minutesAgo(8), fields: { violations: 2, opa_score: "88%", pii: "No", access: "team" } },
    { id: "app_3", name: "sql-copilot", type: "LLM app", owner: "data-tools", status: "Compliant", updated_at: hoursAgo(2), fields: { violations: 0, opa_score: "96%", pii: "No", access: "team" } },
    { id: "mdl_churn", name: "churn-predictor", type: "Model", owner: "ds-team", status: "Compliant", updated_at: daysAgo(2), fields: { violations: 0, opa_score: "94%", pii: "Yes", access: "restricted" } },
    { id: "ds_churn", name: "customer-churn-2026", type: "Dataset", owner: "data-platform", status: "Non-compliant", updated_at: hoursAgo(7), fields: { violations: 1, opa_score: "79%", pii: "Yes", access: "restricted" } },
    { id: "pol_limits", name: "require-resource-limits", type: "Policy", owner: "security", status: "Enforced", updated_at: daysAgo(2), fields: { violations: 4, opa_score: "—", pii: "—", access: "org" } },
    { id: "pl_3", name: "payments_reconcile", type: "Pipeline", owner: "data-platform", status: "Non-compliant", updated_at: hoursAgo(5), fields: { violations: 3, opa_score: "74%", pii: "Yes", access: "restricted" } },
  ],
  "data-engineer": [
    { id: "pl_9", name: "payments_hourly_rollup", type: "Data pipeline", owner: "data-platform", status: "Success", updated_at: minutesAgo(3), fields: { schedule: "0 * * * *", last_run: "3m ago", quality: "99%", consumers: "2 models", refresh: "Hourly" } },
    { id: "pl_1", name: "orders_daily_agg", type: "Data pipeline", owner: "data-platform", status: "Success", updated_at: hoursAgo(6), fields: { schedule: "0 2 * * *", last_run: "6h ago", quality: "98%", consumers: "3 models", refresh: "Daily" } },
    { id: "pl_7", name: "feature_churn_signals", type: "Data pipeline", owner: "data-platform", status: "Failed", updated_at: hoursAgo(7), fields: { schedule: "0 1 * * *", last_run: "7h ago", quality: "63%", consumers: "1 model", refresh: "Daily" } },
    { id: "ds_orders", name: "analytics.orders_daily", type: "Dataset", owner: "data-platform", status: "Published", updated_at: hoursAgo(6), fields: { schedule: "—", last_run: "—", quality: "98%", consumers: "5 downstream", refresh: "Daily" } },
    { id: "fg_activity", name: "customer_activity", type: "Feature group", owner: "ml-platform", status: "Healthy", updated_at: minutesAgo(18), fields: { schedule: "hourly", last_run: "18m ago", quality: "—", consumers: "3 models", refresh: "Hourly" } },
  ],
};

/**
 * Runtime CRUD from the Platform Console plugin (`/`, `/catalog-add`) lives
 * in catalog-overrides.json, keyed by persona id. Each persona's value is a
 * ResourceOverrides record (added / updated / removed) merged on top of the
 * built-in CATALOG. Because this is a plain JSON module import, editing that
 * file triggers a Vite HMR update — changes show up in the running portal live,
 * with no restart.
 */
const OVERRIDES = overridesJson as Record<string, ResourceOverrides<CatalogRow> | CatalogRow[]>;

/** Built-in rows for a persona with the plugin's overrides applied. */
function rowsFor(personaId: string): CatalogRow[] {
  return applyOverrides(CATALOG[personaId] ?? [], normalizeOverrides<CatalogRow>(OVERRIDES[personaId]));
}

export async function getCatalog(personaId: string, filters: CatalogFilters = {}): Promise<CatalogRow[]> {
  await delay();
  const rows = rowsFor(personaId);
  const q = (filters.q ?? "").trim().toLowerCase();
  return rows.filter(
    (r) =>
      (!q || r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q)) &&
      (!filters.type || filters.type === "all" || r.type === filters.type) &&
      (!filters.status || filters.status === "all" || r.status === filters.status)
  );
}

export async function getCatalogAsset(
  personaId: string,
  assetId: string
): Promise<(CatalogRow & { description: string }) | undefined> {
  await delay(200);
  const row = rowsFor(personaId).find((r) => r.id === assetId);
  if (!row) return undefined;
  return {
    ...row,
    description: `${row.type} "${row.name}" owned by ${row.owner}. Registered in the software catalog; open Health, Docs, or its Scorecard for more.`,
  };
}
