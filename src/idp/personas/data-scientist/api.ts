import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Mock API for the Data Scientist persona. Every GET endpoint returns realistic
 * typed dummy data; write endpoints return plausible ids/status so the screens
 * are fully interactive without a backend. Mirrors the app-engineer api.ts.
 */

/* ------------------------------------------------------------------ types */

export type JobStatus =
  | "Queued"
  | "Running"
  | "Complete"
  | "Failed"
  | "Pending approval";

export interface TrainingJob {
  id: string;
  name: string;
  model_type: string;
  dataset: string;
  status: JobStatus;
  started_at: string;
  runtime_min: number;
  best_metric: number;
}

export interface ExperimentSummary {
  id: string;
  name: string;
  run_count: number;
  best_auc: number;
  best_f1: number;
  date: string;
}

export interface DsMetrics {
  active_jobs: number;
  experiments_week: number;
  models_count: number;
  pending_approvals: number;
}

export interface ExperimentRun {
  run_id: string;
  name: string;
  framework: string;
  compute: string;
  metrics: { auc: number; f1: number; accuracy: number };
  training_time_min: number;
  cost: number;
  status: JobStatus;
  date: string;
}

export interface RunDetail extends ExperimentRun {
  hyperparameters: Record<string, string | number>;
  dataset: string;
  loss_curve: { ts: string; train: number; val: number }[];
  metric_curve: { ts: string; auc: number }[];
  logs: string;
  artifacts: { name: string; size: string }[];
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  domain: string;
  size_gb: number;
  last_updated: string;
  owner: string;
  access_level: "Open" | "Restricted" | "Confidential";
  has_access: boolean;
  tags: string[];
  description: string;
}

export interface DatasetSchemaCol {
  column: string;
  type: string;
  sample_values: string[];
}

export interface DatasetLineage {
  upstream: string[];
  downstream: string[];
}

export interface ModelSummary {
  id: string;
  name: string;
  framework: string;
  latest_version: string;
  status: "In prod" | "In staging" | "Archived" | "Pending approval";
  owner: string;
}

export interface ModelVersion {
  id: string;
  version: string;
  dataset: string;
  auc: number;
  f1: number;
  deployed_to: string;
  deployed_by: string;
  date: string;
}

export interface ModelDetail {
  id: string;
  name: string;
  framework: string;
  owner: string;
  status: ModelSummary["status"];
  versions: ModelVersion[];
  lineage: {
    dataset: string;
    training_job: string;
    model_version: string;
    endpoint: string;
  };
}

export interface ApprovalRequest {
  id: string;
  request: string;
  model: string;
  target_env: string;
  requested_by: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface ComputeQuota {
  available_gpus: number;
  available_cpus: number;
  queue_depth: number;
}

/* --------------------------------------------------------------- fixtures */

const TRAINING_JOBS: TrainingJob[] = [
  { id: "job_1", name: "churn-xgb-v7", model_type: "XGBoost", dataset: "customer-churn-2026", status: "Running", started_at: minutesAgo(42), runtime_min: 42, best_metric: 0.883 },
  { id: "job_2", name: "fraud-detector-nn", model_type: "PyTorch", dataset: "txn-fraud-labeled", status: "Running", started_at: minutesAgo(18), runtime_min: 18, best_metric: 0.941 },
  { id: "job_3", name: "ltv-regressor", model_type: "scikit-learn", dataset: "customer-ltv", status: "Complete", started_at: hoursAgo(6), runtime_min: 74, best_metric: 0.812 },
  { id: "job_4", name: "recsys-tower", model_type: "TensorFlow", dataset: "clickstream-90d", status: "Pending approval", started_at: hoursAgo(9), runtime_min: 210, best_metric: 0.906 },
  { id: "job_5", name: "demand-forecast", model_type: "PyTorch", dataset: "sales-history", status: "Queued", started_at: minutesAgo(3), runtime_min: 0, best_metric: 0 },
  { id: "job_6", name: "sentiment-bert", model_type: "PyTorch", dataset: "reviews-corpus", status: "Failed", started_at: hoursAgo(14), runtime_min: 12, best_metric: 0 },
];

const EXPERIMENTS: ExperimentSummary[] = [
  { id: "exp_churn", name: "Customer churn", run_count: 24, best_auc: 0.891, best_f1: 0.842, date: hoursAgo(3) },
  { id: "exp_fraud", name: "Transaction fraud", run_count: 41, best_auc: 0.947, best_f1: 0.903, date: minutesAgo(20) },
  { id: "exp_ltv", name: "Lifetime value", run_count: 12, best_auc: 0.818, best_f1: 0.774, date: daysAgo(1) },
  { id: "exp_recsys", name: "Recommendation tower", run_count: 33, best_auc: 0.912, best_f1: 0.861, date: hoursAgo(9) },
  { id: "exp_demand", name: "Demand forecast", run_count: 8, best_auc: 0.803, best_f1: 0.741, date: daysAgo(2) },
];

const FRAMEWORKS = ["PyTorch", "TensorFlow", "scikit-learn", "XGBoost"];
const COMPUTES = ["GPU single", "GPU high-memory", "CPU standard", "TPU"];

function makeRuns(expId: string): ExperimentRun[] {
  // Deterministic-ish per experiment so compare/detail feel stable.
  const base = expId.length * 7;
  const statuses: JobStatus[] = ["Complete", "Complete", "Complete", "Running", "Failed"];
  return Array.from({ length: 5 }).map((_, i) => {
    const auc = +(0.78 + ((base + i * 13) % 18) / 100).toFixed(3);
    const f1 = +(auc - 0.03 - (i % 3) / 100).toFixed(3);
    const acc = +(auc - 0.01).toFixed(3);
    return {
      run_id: `${expId}-run-${i + 1}`,
      name: `${expId.replace("exp_", "")}-run-${i + 1}`,
      framework: FRAMEWORKS[(base + i) % FRAMEWORKS.length],
      compute: COMPUTES[(base + i) % COMPUTES.length],
      metrics: { auc, f1, accuracy: acc },
      training_time_min: 30 + ((base + i * 17) % 180),
      cost: +(2.4 + ((base + i * 11) % 40) / 3).toFixed(2),
      status: statuses[i % statuses.length],
      date: hoursAgo(i * 6 + 1),
    };
  });
}

const DATASETS: Dataset[] = [
  { id: "ds_1", name: "customer-churn-2026", source: "BigQuery", domain: "Customer", size_gb: 4.2, last_updated: daysAgo(2), owner: "data-eng", access_level: "Open", has_access: true, tags: ["churn", "labeled", "tabular"], description: "Labeled customer churn features aggregated monthly, 1.4M rows across 82 features." },
  { id: "ds_2", name: "txn-fraud-labeled", source: "Snowflake", domain: "Risk", size_gb: 12.8, last_updated: hoursAgo(8), owner: "risk-platform", access_level: "Restricted", has_access: true, tags: ["fraud", "labeled", "imbalanced"], description: "Transaction-level fraud labels with device and geo signals. Heavily imbalanced (0.7% positive)." },
  { id: "ds_3", name: "clickstream-90d", source: "GCS", domain: "Marketing", size_gb: 340.0, last_updated: hoursAgo(2), owner: "growth-analytics", access_level: "Restricted", has_access: false, tags: ["clickstream", "events", "recsys"], description: "Raw 90-day clickstream event logs partitioned by day. Used for sequence modeling." },
  { id: "ds_4", name: "customer-ltv", source: "BigQuery", domain: "Finance", size_gb: 2.1, last_updated: daysAgo(5), owner: "finance-ds", access_level: "Confidential", has_access: false, tags: ["ltv", "revenue"], description: "Modeled lifetime value targets joined to acquisition cohort features." },
  { id: "ds_5", name: "reviews-corpus", source: "GCS", domain: "Product", size_gb: 18.5, last_updated: daysAgo(1), owner: "nlp-team", access_level: "Open", has_access: true, tags: ["nlp", "text", "sentiment"], description: "Cleaned product review text corpus with star-rating weak labels." },
  { id: "ds_6", name: "sales-history", source: "Snowflake", domain: "Sales", size_gb: 6.7, last_updated: hoursAgo(20), owner: "data-eng", access_level: "Open", has_access: true, tags: ["timeseries", "forecast"], description: "Daily SKU-level sales history for the last 3 years, holiday-flagged." },
];

const MODELS: ModelSummary[] = [
  { id: "mdl_churn", name: "churn-classifier", framework: "XGBoost", latest_version: "v7.2.0", status: "In prod", owner: "p.joshipura" },
  { id: "mdl_fraud", name: "fraud-detector", framework: "PyTorch", latest_version: "v3.4.1", status: "In prod", owner: "risk-ds" },
  { id: "mdl_recsys", name: "recsys-tower", framework: "TensorFlow", latest_version: "v2.0.0", status: "Pending approval", owner: "p.joshipura" },
  { id: "mdl_ltv", name: "ltv-regressor", framework: "scikit-learn", latest_version: "v1.5.3", status: "In staging", owner: "finance-ds" },
  { id: "mdl_sentiment", name: "sentiment-bert", framework: "PyTorch", latest_version: "v0.9.0", status: "Archived", owner: "nlp-team" },
];

const APPROVALS: ApprovalRequest[] = [
  { id: "apr_1", request: "Promote recsys-tower v2.0.0", model: "recsys-tower", target_env: "Prod", requested_by: "p.joshipura", date: hoursAgo(9), status: "Pending" },
  { id: "apr_2", request: "Promote ltv-regressor v1.5.3", model: "ltv-regressor", target_env: "Staging", requested_by: "finance-ds", date: daysAgo(1), status: "Pending" },
  { id: "apr_3", request: "Promote fraud-detector v3.4.1", model: "fraud-detector", target_env: "Prod", requested_by: "risk-ds", date: daysAgo(2), status: "Approved" },
  { id: "apr_4", request: "Train sentiment-bert on reviews-corpus", model: "sentiment-bert", target_env: "Dev", requested_by: "nlp-team", date: daysAgo(3), status: "Rejected" },
  { id: "apr_5", request: "Promote churn-classifier v7.2.0", model: "churn-classifier", target_env: "Prod", requested_by: "p.joshipura", date: daysAgo(4), status: "Approved" },
];

function makeVersions(modelId: string): ModelVersion[] {
  const b = modelId.length;
  return Array.from({ length: 3 }).map((_, i) => {
    const major = 3 - i;
    return {
      id: `${modelId}-v${major}`,
      version: `v${major}.${(b + i) % 5}.0`,
      dataset: DATASETS[(b + i) % DATASETS.length].name,
      auc: +(0.9 - i * 0.02 - (b % 3) / 100).toFixed(3),
      f1: +(0.86 - i * 0.02 - (b % 3) / 100).toFixed(3),
      deployed_to: i === 0 ? "Prod" : i === 1 ? "Staging" : "Archived",
      deployed_by: i === 0 ? "argo-cd" : "p.joshipura",
      date: daysAgo(i * 9 + 1),
    };
  });
}

/* ---------------------------------------------------------------- GET fns */

export async function getTrainingJobs(): Promise<TrainingJob[]> {
  await delay();
  return TRAINING_JOBS;
}

export async function getExperimentsSummary(limit = 5): Promise<ExperimentSummary[]> {
  await delay(260);
  return EXPERIMENTS.slice(0, limit);
}

export async function getMetricsSummary(): Promise<DsMetrics> {
  await delay(220);
  return {
    active_jobs: TRAINING_JOBS.filter((j) => j.status === "Running" || j.status === "Queued").length,
    experiments_week: EXPERIMENTS.length,
    models_count: MODELS.length,
    pending_approvals: APPROVALS.filter((a) => a.status === "Pending").length,
  };
}

export async function getExperiments(): Promise<ExperimentSummary[]> {
  await delay();
  return EXPERIMENTS;
}

export async function getExperimentRuns(expId: string): Promise<ExperimentRun[]> {
  await delay();
  return makeRuns(expId);
}

export async function getRunDetail(expId: string, runId: string): Promise<RunDetail> {
  await delay();
  const run = makeRuns(expId).find((r) => r.run_id === runId) ?? makeRuns(expId)[0];
  const loss_curve = Array.from({ length: 10 }).map((_, e) => ({
    ts: `e${e + 1}`,
    train: +(0.68 * Math.exp(-e / 3) + 0.06).toFixed(3),
    val: +(0.72 * Math.exp(-e / 3.2) + 0.09).toFixed(3),
  }));
  const metric_curve = Array.from({ length: 10 }).map((_, e) => ({
    ts: `e${e + 1}`,
    auc: +(run.metrics.auc - 0.18 * Math.exp(-e / 2.5)).toFixed(3),
  }));
  return {
    ...run,
    hyperparameters: {
      learning_rate: 0.003,
      batch_size: 256,
      max_depth: 8,
      n_estimators: 400,
      dropout: 0.2,
      optimizer: "adamw",
      weight_decay: 0.0001,
    },
    dataset: "customer-churn-2026",
    loss_curve,
    metric_curve,
    logs: [
      `[00:00] Starting run ${runId} on ${run.compute}`,
      "[00:01] Loading dataset shards (12 partitions)",
      "[00:04] Epoch 1/10 · train_loss=0.681 val_loss=0.712",
      "[00:31] Epoch 5/10 · train_loss=0.204 val_loss=0.241",
      `[01:02] Epoch 10/10 · val_auc=${run.metrics.auc}`,
      "[01:03] Persisting artifacts to gs://ml-artifacts/",
      "[01:03] Run complete",
    ].join("\n"),
    artifacts: [
      { name: "model.pt", size: "184 MB" },
      { name: "metrics.json", size: "3 KB" },
      { name: "confusion_matrix.png", size: "42 KB" },
      { name: "feature_importance.csv", size: "9 KB" },
    ],
  };
}

export async function getDatasets(
  search = "",
  source = "all",
  domain = "all"
): Promise<Dataset[]> {
  await delay();
  const q = search.trim().toLowerCase();
  return DATASETS.filter(
    (d) =>
      (!q || d.name.toLowerCase().includes(q) || d.tags.some((t) => t.includes(q))) &&
      (source === "all" || d.source === source) &&
      (domain === "all" || d.domain === domain)
  );
}

export async function getDatasetSchema(id: string): Promise<DatasetSchemaCol[]> {
  await delay();
  void id;
  return [
    { column: "customer_id", type: "STRING", sample_values: ["c_10482", "c_20194", "c_88213", "c_33019", "c_47725"] },
    { column: "tenure_months", type: "INT64", sample_values: ["14", "3", "47", "22", "9"] },
    { column: "monthly_spend", type: "FLOAT64", sample_values: ["82.40", "19.99", "140.10", "55.00", "27.30"] },
    { column: "support_tickets", type: "INT64", sample_values: ["0", "2", "1", "5", "0"] },
    { column: "churned", type: "BOOL", sample_values: ["false", "true", "false", "true", "false"] },
  ];
}

export async function getDatasetLineage(id: string): Promise<DatasetLineage> {
  await delay();
  void id;
  return {
    upstream: ["raw.crm_customers", "raw.billing_events", "raw.support_tickets"],
    downstream: ["churn-classifier", "ltv-regressor", "dashboard.retention"],
  };
}

export async function getComputeQuota(): Promise<ComputeQuota> {
  await delay(180);
  return { available_gpus: 6, available_cpus: 128, queue_depth: 2 };
}

export async function getModels(): Promise<ModelSummary[]> {
  await delay();
  return MODELS;
}

export async function getModel(id: string): Promise<ModelDetail> {
  await delay();
  const m = MODELS.find((x) => x.id === id) ?? MODELS[0];
  return {
    id: m.id,
    name: m.name,
    framework: m.framework,
    owner: m.owner,
    status: m.status,
    versions: makeVersions(m.id),
    lineage: {
      dataset: "customer-churn-2026",
      training_job: `${m.name}-train-42`,
      model_version: m.latest_version,
      endpoint: `serving/${m.name}`,
    },
  };
}

export async function getFeatureImportance(
  id: string,
  versionId: string
): Promise<{ name: string; value: number }[]> {
  await delay();
  void id;
  void versionId;
  return [
    { name: "tenure_months", value: 0.28 },
    { name: "monthly_spend", value: 0.21 },
    { name: "support_tickets", value: 0.16 },
    { name: "contract_type", value: 0.11 },
    { name: "last_login_days", value: 0.08 },
    { name: "payment_method", value: 0.06 },
    { name: "add_on_count", value: 0.045 },
    { name: "region", value: 0.03 },
    { name: "discount_pct", value: 0.02 },
    { name: "device_type", value: 0.015 },
  ];
}

export async function getApprovals(): Promise<ApprovalRequest[]> {
  await delay();
  return APPROVALS;
}

/* --------------------------------------------------------------- WRITE fns */

export async function createTrainingJob(
  _body: unknown
): Promise<{ job_id: string; pipeline_run_id: string }> {
  await delay(700);
  return { job_id: uid("job"), pipeline_run_id: uid("run") };
}

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  log: string;
}

export async function getPipelineStatus(_id: string): Promise<{ steps: PipelineStep[] }> {
  await delay(500);
  return {
    steps: [
      { name: "Validate request (dataset, quota, policy)", status: "success", log: "dataset exists · 6 GPUs available · policy OK" },
      { name: "Build training container", status: "success", log: "image ml-train:cuda12 built (312 MB)" },
      { name: "Trigger training job on compute", status: "success", log: "scheduled on gpu-pool-a (1×A100)" },
      { name: "Stream training logs", status: "running", log: "epoch 4/10 · val_auc=0.871…" },
      { name: "Evaluate against metric threshold", status: "pending", log: "" },
      { name: "Register model if passed", status: "pending", log: "" },
      { name: "Request approval if env requires", status: "pending", log: "" },
      { name: "Deploy to serving endpoint", status: "pending", log: "" },
    ],
  };
}

export async function requestDatasetAccess(
  _id: string,
  _justification: string
): Promise<{ ticket_id: string }> {
  await delay(500);
  return { ticket_id: uid("REQ").toUpperCase() };
}

export async function promoteRun(_runId: string): Promise<{ registry_model_id: string }> {
  await delay(600);
  return { registry_model_id: uid("mdl") };
}

export async function promoteModel(
  _id: string,
  _body: unknown
): Promise<{ approval_id: string }> {
  await delay(600);
  return { approval_id: uid("apr") };
}

export async function rollbackModel(
  _id: string,
  _versionId: string
): Promise<{ status: string }> {
  await delay(500);
  return { status: "Rolling back" };
}

export async function submitForApproval(_jobId: string): Promise<{ approval_id: string }> {
  await delay(400);
  return { approval_id: uid("apr") };
}

export async function actionApproval(
  _id: string,
  decision: "Approved" | "Rejected"
): Promise<{ status: string }> {
  await delay(400);
  return { status: decision };
}
