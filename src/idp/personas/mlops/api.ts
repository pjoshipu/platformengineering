import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Mock API for the MLOps Engineer persona. All GET endpoints return realistic
 * dummy data; write endpoints return plausible ids/status so screens are fully
 * interactive without a backend.
 */

export type DriftStatus = "No drift" | "Warning" | "Critical";
export type PipelineStatus = "Running" | "Success" | "Failed" | "Skipped";

export interface Pipeline {
  id: string;
  name: string;
  last_run: string;
  duration_min: number;
  status: PipelineStatus;
  next_run: string;
  model_id: string;
  model_name: string;
  drift_status: DriftStatus;
}

export interface DriftAlert {
  id: string;
  model_id: string;
  model_name: string;
  feature: string;
  drift_score: number;
  severity: "Warning" | "Critical";
  created_at: string;
}

export interface MlopsMetrics {
  healthy_pipelines: number;
  total_pipelines: number;
  drift_alerts: number;
  retraining_today: number;
  gpu_utilisation: number;
}

export interface FeatureDrift {
  name: string;
  baseline_mean: number;
  current_mean: number;
  score: number;
  type: "Covariate" | "Concept";
  status: DriftStatus;
}

export interface DriftReport {
  model_id: string;
  model_name: string;
  overall_score: number;
  trend: number; // delta vs previous period (positive = worse)
  threshold: number;
  days_since_training: number;
  source_dataset: string;
  features: FeatureDrift[];
  prediction_drift: { ts: string; class_a: number; class_b: number; class_c: number }[];
}

export interface FeatureHistogram {
  bins: string[];
  baseline_hist: number[];
  current_hist: number[];
}

export type TriggerType =
  | "Drift threshold"
  | "Schedule"
  | "Performance degradation"
  | "Manual only";

export interface RetrainingRule {
  id: string;
  name: string;
  model_id: string;
  model_name: string;
  trigger_type: TriggerType;
  condition: string;
  last_triggered: string | null;
  enabled: boolean;
}

export interface MlModel {
  id: string;
  name: string;
}

export interface InfraNode {
  id: string;
  name: string;
  type: "GPU node" | "Training cluster" | "Serving endpoint";
  status: "Ready" | "Running" | "Provisioning" | "Failed" | "Idle";
  utilisation: number;
  region: string;
  age: string;
}

export interface InfraMetrics {
  gpu_utilisation: number;
  active_training_nodes: number;
  serving_endpoints: number;
  queue_depth: number;
}

export interface AuditEvent {
  id: string;
  ts: string;
  user: string;
  action: "Retrain" | "Promote" | "Rule change" | "Pipeline edit";
  resource: string;
  outcome: "Success" | "Failed";
  details: string;
  payload: Record<string, unknown>;
}

export const MODELS: MlModel[] = [
  { id: "mdl_churn", name: "churn-predictor" },
  { id: "mdl_fraud", name: "fraud-detection" },
  { id: "mdl_reco", name: "product-recommender" },
  { id: "mdl_ltv", name: "customer-ltv" },
  { id: "mdl_demand", name: "demand-forecast" },
];

const modelName = (id: string) => MODELS.find((m) => m.id === id)?.name ?? id;

const PIPELINES: Pipeline[] = [
  { id: "pl_1", name: "churn-training", last_run: hoursAgo(3), duration_min: 42, status: "Success", next_run: hoursAgo(-21), model_id: "mdl_churn", model_name: "churn-predictor", drift_status: "Critical" },
  { id: "pl_2", name: "fraud-training", last_run: minutesAgo(25), duration_min: 18, status: "Running", next_run: hoursAgo(-6), model_id: "mdl_fraud", model_name: "fraud-detection", drift_status: "Warning" },
  { id: "pl_3", name: "reco-feature-build", last_run: hoursAgo(8), duration_min: 63, status: "Success", next_run: hoursAgo(-16), model_id: "mdl_reco", model_name: "product-recommender", drift_status: "No drift" },
  { id: "pl_4", name: "ltv-training", last_run: daysAgo(1), duration_min: 55, status: "Failed", next_run: hoursAgo(-2), model_id: "mdl_ltv", model_name: "customer-ltv", drift_status: "Warning" },
  { id: "pl_5", name: "demand-forecast-training", last_run: hoursAgo(12), duration_min: 37, status: "Skipped", next_run: hoursAgo(-12), model_id: "mdl_demand", model_name: "demand-forecast", drift_status: "No drift" },
  { id: "pl_6", name: "reco-embeddings-refresh", last_run: hoursAgo(5), duration_min: 21, status: "Success", next_run: hoursAgo(-19), model_id: "mdl_reco", model_name: "product-recommender", drift_status: "No drift" },
];

const DRIFT_ALERTS: DriftAlert[] = [
  { id: "al_1", model_id: "mdl_churn", model_name: "churn-predictor", feature: "monthly_charges", drift_score: 0.71, severity: "Critical", created_at: hoursAgo(2) },
  { id: "al_2", model_id: "mdl_churn", model_name: "churn-predictor", feature: "tenure_months", drift_score: 0.58, severity: "Warning", created_at: hoursAgo(4) },
  { id: "al_3", model_id: "mdl_fraud", model_name: "fraud-detection", feature: "txn_amount", drift_score: 0.63, severity: "Warning", created_at: hoursAgo(6) },
  { id: "al_4", model_id: "mdl_ltv", model_name: "customer-ltv", feature: "orders_90d", drift_score: 0.55, severity: "Warning", created_at: hoursAgo(9) },
];

let RETRAINING_RULES: RetrainingRule[] = [
  { id: "rl_1", name: "Churn drift auto-retrain", model_id: "mdl_churn", model_name: "churn-predictor", trigger_type: "Drift threshold", condition: "drift score > 0.60 on any feature", last_triggered: hoursAgo(2), enabled: true },
  { id: "rl_2", name: "Fraud weekly refresh", model_id: "mdl_fraud", model_name: "fraud-detection", trigger_type: "Schedule", condition: "Every Monday at 9am UTC", last_triggered: daysAgo(3), enabled: true },
  { id: "rl_3", name: "Reco accuracy guard", model_id: "mdl_reco", model_name: "product-recommender", trigger_type: "Performance degradation", condition: "precision@10 < 0.72", last_triggered: daysAgo(11), enabled: false },
  { id: "rl_4", name: "LTV manual only", model_id: "mdl_ltv", model_name: "customer-ltv", trigger_type: "Manual only", condition: "Triggered manually by owner", last_triggered: null, enabled: true },
];

const INFRA_NODES: InfraNode[] = [
  { id: "in_1", name: "gpu-a100-01", type: "GPU node", status: "Running", utilisation: 87, region: "us-central1", age: "12d" },
  { id: "in_2", name: "gpu-a100-02", type: "GPU node", status: "Idle", utilisation: 4, region: "us-central1", age: "12d" },
  { id: "in_3", name: "training-cluster-prod", type: "Training cluster", status: "Running", utilisation: 72, region: "us-east1", age: "44d" },
  { id: "in_4", name: "training-cluster-exp", type: "Training cluster", status: "Provisioning", utilisation: 0, region: "europe-west4", age: "3m" },
  { id: "in_5", name: "churn-serving", type: "Serving endpoint", status: "Ready", utilisation: 41, region: "us-central1", age: "60d" },
  { id: "in_6", name: "fraud-serving", type: "Serving endpoint", status: "Ready", utilisation: 63, region: "us-central1", age: "58d" },
  { id: "in_7", name: "reco-serving", type: "Serving endpoint", status: "Failed", utilisation: 0, region: "us-east1", age: "9d" },
];

const AUDIT_EVENTS: AuditEvent[] = [
  { id: "ev_1", ts: hoursAgo(2), user: "auto-retrain-bot", action: "Retrain", resource: "churn-predictor", outcome: "Success", details: "Triggered by drift rule rl_1", payload: { rule_id: "rl_1", drift_score: 0.71, job_id: "job_a1b2c3" } },
  { id: "ev_2", ts: hoursAgo(5), user: "p.joshipura", action: "Rule change", resource: "reco-accuracy-guard", outcome: "Success", details: "Disabled rule", payload: { rule_id: "rl_3", change: "enabled: true -> false" } },
  { id: "ev_3", ts: hoursAgo(7), user: "m.chen", action: "Promote", resource: "fraud-detection v14", outcome: "Success", details: "Promoted staging -> prod", payload: { model_id: "mdl_fraud", from: "staging", to: "prod", version: "v14" } },
  { id: "ev_4", ts: daysAgo(1), user: "auto-retrain-bot", action: "Retrain", resource: "customer-ltv", outcome: "Failed", details: "Training job OOM on gpu-a100-02", payload: { rule_id: "rl_1", job_id: "job_d4e5f6", error: "CUDA out of memory" } },
  { id: "ev_5", ts: daysAgo(2), user: "s.patel", action: "Pipeline edit", resource: "demand-forecast-training", outcome: "Success", details: "Changed schedule to every 12h", payload: { pipeline_id: "pl_5", schedule: "0 */12 * * *" } },
  { id: "ev_6", ts: daysAgo(3), user: "auto-retrain-bot", action: "Retrain", resource: "fraud-detection", outcome: "Success", details: "Scheduled weekly refresh", payload: { rule_id: "rl_2", job_id: "job_g7h8i9" } },
];

// ---- GET /api/metrics/summary?persona=mlops ----
export async function getMetrics(): Promise<MlopsMetrics> {
  await delay(260);
  const healthy = PIPELINES.filter((p) => p.status === "Success" || p.status === "Running").length;
  return {
    healthy_pipelines: healthy,
    total_pipelines: PIPELINES.length,
    drift_alerts: DRIFT_ALERTS.length,
    retraining_today: 3,
    gpu_utilisation: 68,
  };
}

// ---- GET /api/mlops/pipelines ----
export async function getPipelines(): Promise<Pipeline[]> {
  await delay();
  return PIPELINES;
}

// ---- GET /api/mlops/drift/alerts?active=true ----
export async function getDriftAlerts(): Promise<DriftAlert[]> {
  await delay(300);
  return DRIFT_ALERTS;
}

// ---- recent run history for a pipeline (Pipeline Monitor drawer) ----
export async function getPipelineRuns(pipelineId: string) {
  await delay();
  const seed = PIPELINES.find((p) => p.id === pipelineId)?.duration_min ?? 30;
  const statuses: PipelineStatus[] = ["Success", "Success", "Failed", "Success", "Skipped", "Success"];
  const runs = Array.from({ length: 6 }).map((_, i) => {
    const dur = Math.max(8, Math.round(seed + Math.sin(i) * 9));
    return {
      id: uid("run"),
      ts: hoursAgo(6 * (i + 1)),
      status: statuses[i % statuses.length],
      duration_min: dur,
    };
  });
  return {
    runs,
    chart: runs
      .slice()
      .reverse()
      .map((r) => ({ ts: new Date(r.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }), duration: r.duration_min })),
  };
}

// ---- GET /api/mlops/drift/:modelId?range=7d ----
export async function getDriftReport(modelId: string, _range = "7d"): Promise<DriftReport> {
  await delay();
  const seed = MODELS.findIndex((m) => m.id === modelId);
  const overall = [0.71, 0.63, 0.22, 0.55, 0.18][seed] ?? 0.3;
  const trend = [0.14, 0.06, -0.03, 0.09, -0.01][seed] ?? 0.0;
  const featureSets: Record<string, FeatureDrift[]> = {
    mdl_churn: [
      { name: "monthly_charges", baseline_mean: 64.2, current_mean: 78.9, score: 0.71, type: "Covariate", status: "Critical" },
      { name: "tenure_months", baseline_mean: 32.1, current_mean: 24.8, score: 0.58, type: "Covariate", status: "Warning" },
      { name: "support_tickets", baseline_mean: 1.3, current_mean: 1.4, score: 0.19, type: "Concept", status: "No drift" },
      { name: "contract_type", baseline_mean: 0.55, current_mean: 0.61, score: 0.24, type: "Covariate", status: "No drift" },
    ],
    mdl_fraud: [
      { name: "txn_amount", baseline_mean: 142.5, current_mean: 188.3, score: 0.63, type: "Covariate", status: "Warning" },
      { name: "txn_velocity", baseline_mean: 3.1, current_mean: 3.4, score: 0.31, type: "Concept", status: "No drift" },
      { name: "device_new", baseline_mean: 0.12, current_mean: 0.18, score: 0.27, type: "Covariate", status: "No drift" },
    ],
  };
  const features =
    featureSets[modelId] ?? [
      { name: "feature_1", baseline_mean: 10.0, current_mean: 10.4, score: 0.18, type: "Covariate", status: "No drift" },
      { name: "feature_2", baseline_mean: 4.2, current_mean: 4.3, score: 0.12, type: "Concept", status: "No drift" },
      { name: "feature_3", baseline_mean: 0.5, current_mean: 0.52, score: 0.21, type: "Covariate", status: "No drift" },
    ];
  const prediction_drift = Array.from({ length: 8 }).map((_, i) => ({
    ts: new Date(Date.now() - (7 - i) * 86_400_000).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    class_a: Math.round(50 + Math.sin(i) * 8 + i * (overall > 0.5 ? 2 : 0)),
    class_b: Math.round(30 - Math.sin(i) * 5),
    class_c: Math.round(20 + Math.cos(i) * 4),
  }));
  return {
    model_id: modelId,
    model_name: modelName(modelId),
    overall_score: overall,
    trend,
    threshold: 0.5,
    days_since_training: [2, 4, 9, 1, 6][seed] ?? 5,
    source_dataset: `bq://ml_features.${modelName(modelId).replace(/-/g, "_")}_training`,
    features,
    prediction_drift,
  };
}

// ---- GET /api/mlops/drift/:modelId/features/:featureName ----
export async function getFeatureHistogram(_modelId: string, featureName: string): Promise<FeatureHistogram> {
  await delay();
  const bins = ["<20", "20-40", "40-60", "60-80", "80-100", ">100"];
  return {
    bins,
    baseline_hist: [8, 22, 34, 24, 9, 3],
    current_hist: [3, 12, 26, 31, 19, 9],
  };
}

// ---- POST /api/mlops/retrain/:modelId ----
export async function triggerRetraining(modelId: string): Promise<{ job_id: string }> {
  await delay(600);
  return { job_id: uid("job") + "-" + modelId };
}

// ---- GET /api/mlops/retraining-rules ----
export async function getRetrainingRules(): Promise<RetrainingRule[]> {
  await delay();
  return RETRAINING_RULES;
}

// ---- POST /api/mlops/retraining-rules ----
export async function createRetrainingRule(body: Partial<RetrainingRule>): Promise<{ rule_id: string }> {
  await delay(500);
  const rule_id = uid("rl");
  RETRAINING_RULES = [
    ...RETRAINING_RULES,
    {
      id: rule_id,
      name: body.name ?? "Untitled rule",
      model_id: body.model_id ?? MODELS[0].id,
      model_name: modelName(body.model_id ?? MODELS[0].id),
      trigger_type: body.trigger_type ?? "Manual only",
      condition: body.condition ?? "—",
      last_triggered: null,
      enabled: body.enabled ?? true,
    },
  ];
  return { rule_id };
}

// ---- PUT /api/mlops/retraining-rules/:id ----
export async function updateRetrainingRule(id: string, patch: Partial<RetrainingRule>): Promise<{ status: string }> {
  await delay(400);
  RETRAINING_RULES = RETRAINING_RULES.map((r) =>
    r.id === id ? { ...r, ...patch, model_name: patch.model_id ? modelName(patch.model_id) : r.model_name } : r
  );
  return { status: "updated" };
}

// ---- DELETE /api/mlops/retraining-rules/:id ----
export async function deleteRetrainingRule(id: string): Promise<{ status: string }> {
  await delay(400);
  RETRAINING_RULES = RETRAINING_RULES.filter((r) => r.id !== id);
  return { status: "deleted" };
}

// ---- POST /api/mlops/retraining-rules/:id/test ----
export async function testRetrainingRule(_id: string): Promise<{ would_trigger_count: number; last_30d_dates: string[] }> {
  await delay(500);
  const count = 2 + Math.floor(Math.random() * 4);
  const dates = Array.from({ length: count }).map((_, i) =>
    new Date(Date.now() - (i * 6 + 2) * 86_400_000).toLocaleDateString()
  );
  return { would_trigger_count: count, last_30d_dates: dates };
}

// ---- ML infrastructure ----
export async function getInfraNodes(): Promise<InfraNode[]> {
  await delay();
  return INFRA_NODES;
}

export async function getInfraMetrics(): Promise<InfraMetrics> {
  await delay(240);
  return { gpu_utilisation: 68, active_training_nodes: 2, serving_endpoints: 3, queue_depth: 4 };
}

// ---- Audit log ----
export async function getAuditEvents(): Promise<AuditEvent[]> {
  await delay();
  return AUDIT_EVENTS;
}
