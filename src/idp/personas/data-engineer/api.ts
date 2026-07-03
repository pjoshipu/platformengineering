import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Mock API for the Data Engineer persona. All GET endpoints return realistic
 * dummy data; write endpoints return plausible ids/status so screens are fully
 * interactive without a backend.
 */

export type PipelineStatus = "Running" | "Success" | "Failed" | "Skipped";
export type Severity = "critical" | "high" | "medium" | "low";

export interface Pipeline {
  id: string;
  name: string;
  schedule: string;
  last_run: string;
  duration_min: number;
  status: PipelineStatus;
  output_dataset: string;
  quality_score: number;
}

export interface QualityAlert {
  dataset_id: string;
  check_name: string;
  severity: Severity;
  failed_rows: number;
  created_at: string;
}

export interface DataMetrics {
  running_pipelines: number;
  failed_today: number;
  datasets_published: number;
  quality_alerts: number;
}

export interface FeatureGroup {
  id: string;
  name: string;
  entity_type: string;
  feature_count: number;
  freshness_min: number;
  consumer_count: number;
  last_updated: string;
}

export interface Feature {
  name: string;
  type: string;
  description: string;
  sample_value: string;
  null_rate: number;
}

export interface FeatureGroupDetail {
  id: string;
  name: string;
  entity_type: string;
  features: Feature[];
  consumers: string[];
  freshness_chart: { ts: string; minutes: number }[];
}

export type QualityCheckType = "Not null" | "Unique" | "Value range" | "Custom";

export interface QualityCheck {
  id: string;
  dataset: string;
  check_name: string;
  type: QualityCheckType;
  pass_rate: number;
  failed_rows: number;
  severity: Severity;
  last_run: string;
  status: "Passing" | "Failing" | "Warning";
}

export type LineageType =
  | "source"
  | "pipeline"
  | "dataset"
  | "feature-group"
  | "model"
  | "endpoint";

export interface LineageNode {
  id: string;
  name: string;
  type: LineageType;
  owner: string;
  updated: string;
}

export interface LineageEdge {
  source: string;
  target: string;
}

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

const PIPELINES: Pipeline[] = [
  { id: "pl_1", name: "orders_daily_agg", schedule: "0 2 * * *", last_run: hoursAgo(6), duration_min: 12, status: "Success", output_dataset: "analytics.orders_daily", quality_score: 98 },
  { id: "pl_2", name: "customer_360_build", schedule: "0 */4 * * *", last_run: minutesAgo(22), duration_min: 34, status: "Running", output_dataset: "crm.customer_360", quality_score: 91 },
  { id: "pl_3", name: "payments_reconcile", schedule: "15 3 * * *", last_run: hoursAgo(5), duration_min: 8, status: "Failed", output_dataset: "finance.payments_recon", quality_score: 74 },
  { id: "pl_4", name: "clickstream_sessionize", schedule: "@hourly", last_run: minutesAgo(40), duration_min: 5, status: "Success", output_dataset: "product.web_sessions", quality_score: 96 },
  { id: "pl_5", name: "marketing_attribution", schedule: "0 5 * * *", last_run: hoursAgo(8), duration_min: 19, status: "Skipped", output_dataset: "marketing.attribution", quality_score: 88 },
  { id: "pl_6", name: "inventory_snapshot", schedule: "0 * * * *", last_run: minutesAgo(12), duration_min: 3, status: "Success", output_dataset: "ops.inventory_snap", quality_score: 99 },
  { id: "pl_7", name: "feature_churn_signals", schedule: "0 1 * * *", last_run: hoursAgo(7), duration_min: 22, status: "Failed", output_dataset: "ml.churn_features", quality_score: 63 },
];

const QUALITY_ALERTS: QualityAlert[] = [
  { dataset_id: "finance.payments_recon", check_name: "amount_not_null", severity: "critical", failed_rows: 1420, created_at: hoursAgo(5) },
  { dataset_id: "ml.churn_features", check_name: "tenure_range_0_120", severity: "high", failed_rows: 812, created_at: hoursAgo(7) },
  { dataset_id: "crm.customer_360", check_name: "email_unique", severity: "medium", failed_rows: 47, created_at: minutesAgo(90) },
  { dataset_id: "marketing.attribution", check_name: "channel_in_allowlist", severity: "low", failed_rows: 9, created_at: hoursAgo(9) },
];

const FEATURE_GROUPS: FeatureGroup[] = [
  { id: "fg_1", name: "customer_activity", entity_type: "customer", feature_count: 14, freshness_min: 18, consumer_count: 3, last_updated: minutesAgo(18) },
  { id: "fg_2", name: "order_velocity", entity_type: "customer", feature_count: 8, freshness_min: 240, consumer_count: 2, last_updated: hoursAgo(4) },
  { id: "fg_3", name: "product_embeddings", entity_type: "product", feature_count: 32, freshness_min: 1440, consumer_count: 4, last_updated: daysAgo(1) },
  { id: "fg_4", name: "session_signals", entity_type: "session", feature_count: 11, freshness_min: 60, consumer_count: 1, last_updated: hoursAgo(1) },
  { id: "fg_5", name: "fraud_indicators", entity_type: "transaction", feature_count: 19, freshness_min: 5, consumer_count: 2, last_updated: minutesAgo(5) },
];

const FEATURES_BY_GROUP: Record<string, Feature[]> = {
  fg_1: [
    { name: "days_since_last_order", type: "int", description: "Days since customer's most recent order", sample_value: "7", null_rate: 0.2 },
    { name: "orders_30d", type: "int", description: "Order count in trailing 30 days", sample_value: "3", null_rate: 0.0 },
    { name: "avg_basket_value", type: "float", description: "Average basket value (USD)", sample_value: "84.20", null_rate: 1.1 },
    { name: "is_active", type: "bool", description: "Active in last 90 days", sample_value: "true", null_rate: 0.0 },
  ],
  fg_5: [
    { name: "velocity_1h", type: "float", description: "Txn count in trailing hour", sample_value: "2.0", null_rate: 0.0 },
    { name: "amount_zscore", type: "float", description: "Z-score of txn amount vs history", sample_value: "1.42", null_rate: 0.4 },
    { name: "new_device", type: "bool", description: "First-seen device flag", sample_value: "false", null_rate: 0.0 },
  ],
};

const CONSUMERS_BY_GROUP: Record<string, string[]> = {
  fg_1: ["churn_predictor_v3", "ltv_regressor", "next_best_offer"],
  fg_2: ["churn_predictor_v3", "ltv_regressor"],
  fg_3: ["recommender_v2", "search_ranker", "cold_start", "cross_sell"],
  fg_4: ["session_bounce_model"],
  fg_5: ["fraud_scorer_v4", "chargeback_predictor"],
};

const QUALITY_CHECKS: QualityCheck[] = [
  { id: "qc_1", dataset: "finance.payments_recon", check_name: "amount_not_null", type: "Not null", pass_rate: 88.4, failed_rows: 1420, severity: "critical", last_run: hoursAgo(5), status: "Failing" },
  { id: "qc_2", dataset: "crm.customer_360", check_name: "email_unique", type: "Unique", pass_rate: 99.6, failed_rows: 47, severity: "medium", last_run: minutesAgo(90), status: "Warning" },
  { id: "qc_3", dataset: "ml.churn_features", check_name: "tenure_range_0_120", type: "Value range", pass_rate: 93.1, failed_rows: 812, severity: "high", last_run: hoursAgo(7), status: "Failing" },
  { id: "qc_4", dataset: "analytics.orders_daily", check_name: "order_id_unique", type: "Unique", pass_rate: 100, failed_rows: 0, severity: "low", last_run: hoursAgo(6), status: "Passing" },
  { id: "qc_5", dataset: "product.web_sessions", check_name: "session_id_not_null", type: "Not null", pass_rate: 100, failed_rows: 0, severity: "low", last_run: minutesAgo(40), status: "Passing" },
  { id: "qc_6", dataset: "marketing.attribution", check_name: "channel_in_allowlist", type: "Custom", pass_rate: 99.9, failed_rows: 9, severity: "low", last_run: hoursAgo(9), status: "Warning" },
  { id: "qc_7", dataset: "ops.inventory_snap", check_name: "qty_gte_zero", type: "Value range", pass_rate: 100, failed_rows: 0, severity: "low", last_run: minutesAgo(12), status: "Passing" },
];

const SOURCE_SCHEMAS: Record<string, { fields: { name: string; label: string; type: "text" | "select"; placeholder?: string; options?: string[] }[] }> = {
  postgres: { fields: [
    { name: "host", label: "Host", type: "text", placeholder: "db.internal:5432" },
    { name: "database", label: "Database", type: "text", placeholder: "prod" },
    { name: "table", label: "Table / query", type: "text", placeholder: "public.orders" },
  ] },
  bigquery: { fields: [
    { name: "project", label: "GCP project", type: "text", placeholder: "acme-analytics" },
    { name: "dataset", label: "Dataset", type: "text", placeholder: "raw" },
    { name: "table", label: "Table", type: "text", placeholder: "orders" },
  ] },
  gcs: { fields: [
    { name: "bucket", label: "Bucket", type: "text", placeholder: "gs://acme-landing" },
    { name: "prefix", label: "Path prefix", type: "text", placeholder: "orders/dt=*" },
    { name: "format", label: "Format", type: "select", options: ["parquet", "csv", "json", "avro"] },
  ] },
  kafka: { fields: [
    { name: "brokers", label: "Brokers", type: "text", placeholder: "kafka:9092" },
    { name: "topic", label: "Topic", type: "text", placeholder: "orders.events" },
    { name: "format", label: "Value format", type: "select", options: ["json", "avro", "protobuf"] },
  ] },
  s3: { fields: [
    { name: "bucket", label: "Bucket", type: "text", placeholder: "s3://acme-landing" },
    { name: "prefix", label: "Path prefix", type: "text", placeholder: "events/" },
    { name: "format", label: "Format", type: "select", options: ["parquet", "csv", "json"] },
  ] },
};

const SEARCH_ASSETS: LineageNode[] = [
  { id: "src_pg", name: "orders-postgres", type: "source", owner: "platform", updated: daysAgo(30) },
  { id: "pl_orders", name: "orders_daily_agg", type: "pipeline", owner: "p.joshipura", updated: hoursAgo(6) },
  { id: "ds_orders", name: "analytics.orders_daily", type: "dataset", owner: "p.joshipura", updated: hoursAgo(6) },
  { id: "fg_activity", name: "customer_activity", type: "feature-group", owner: "ml-platform", updated: minutesAgo(18) },
  { id: "mdl_churn", name: "churn_predictor_v3", type: "model", owner: "ds-team", updated: daysAgo(2) },
  { id: "ep_churn", name: "/predict/churn", type: "endpoint", owner: "ml-platform", updated: daysAgo(2) },
];

// ---------------------------------------------------------------------------
// GET endpoints
// ---------------------------------------------------------------------------

export async function getPipelines(): Promise<Pipeline[]> {
  await delay();
  return PIPELINES;
}

export async function getQualityAlerts(): Promise<QualityAlert[]> {
  await delay(300);
  return QUALITY_ALERTS;
}

export async function getMetrics(): Promise<DataMetrics> {
  await delay(260);
  return {
    running_pipelines: PIPELINES.filter((p) => p.status === "Running").length,
    failed_today: PIPELINES.filter((p) => p.status === "Failed").length,
    datasets_published: 42,
    quality_alerts: QUALITY_ALERTS.length,
  };
}

export async function getSourceConfigSchema(type: string) {
  await delay(180);
  return SOURCE_SCHEMAS[type] ?? { fields: [] };
}

export async function getFeatureGroups(): Promise<FeatureGroup[]> {
  await delay();
  return FEATURE_GROUPS;
}

export async function getFeatureGroup(id: string): Promise<FeatureGroupDetail | undefined> {
  await delay();
  const g = FEATURE_GROUPS.find((f) => f.id === id);
  if (!g) return undefined;
  const features = FEATURES_BY_GROUP[id] ?? [
    { name: "feature_a", type: "float", description: "Derived feature", sample_value: "0.5", null_rate: 0.3 },
    { name: "feature_b", type: "int", description: "Count feature", sample_value: "12", null_rate: 0.0 },
  ];
  return {
    id: g.id,
    name: g.name,
    entity_type: g.entity_type,
    features,
    consumers: CONSUMERS_BY_GROUP[id] ?? [],
    freshness_chart: Array.from({ length: 8 }, (_, i) => ({
      ts: `${(8 - i) * 3}h`,
      minutes: Math.round(g.freshness_min * (0.7 + Math.random() * 0.6)),
    })),
  };
}

export async function getQualityChecks(): Promise<QualityCheck[]> {
  await delay();
  return QUALITY_CHECKS;
}

export async function getQualityCheckDetail(id: string) {
  await delay(300);
  const c = QUALITY_CHECKS.find((q) => q.id === id);
  return {
    failed_samples: Array.from({ length: Math.min(6, c?.failed_rows ? 6 : 0) }, (_, i) => ({
      row_id: uid("row"),
      column: c?.check_name.split("_")[0] ?? "value",
      value: i % 2 === 0 ? "null" : String(-1 * (i + 1)),
      reason: c?.type === "Not null" ? "value is null" : c?.type === "Unique" ? "duplicate key" : "out of allowed range",
    })),
    pass_rate_history: Array.from({ length: 10 }, (_, i) => ({
      ts: `d-${9 - i}`,
      pass_rate: Math.round((c ? c.pass_rate : 95) + (Math.random() * 6 - 3)),
    })),
  };
}

export async function searchLineage(q: string): Promise<LineageNode[]> {
  await delay(200);
  const term = q.trim().toLowerCase();
  if (!term) return SEARCH_ASSETS;
  return SEARCH_ASSETS.filter(
    (a) => a.name.toLowerCase().includes(term) || a.type.includes(term)
  );
}

export async function getLineageGraph(assetId: string, _depth = 3): Promise<{ nodes: LineageNode[]; edges: LineageEdge[] }> {
  await delay(350);
  const nodes: LineageNode[] = [
    { id: "src_pg", name: "orders-postgres", type: "source", owner: "platform", updated: daysAgo(30) },
    { id: "src_kafka", name: "events-kafka", type: "source", owner: "platform", updated: daysAgo(12) },
    { id: "pl_orders", name: "orders_daily_agg", type: "pipeline", owner: "p.joshipura", updated: hoursAgo(6) },
    { id: "pl_c360", name: "customer_360_build", type: "pipeline", owner: "p.joshipura", updated: minutesAgo(22) },
    { id: "ds_orders", name: "analytics.orders_daily", type: "dataset", owner: "p.joshipura", updated: hoursAgo(6) },
    { id: "ds_c360", name: "crm.customer_360", type: "dataset", owner: "p.joshipura", updated: minutesAgo(22) },
    { id: "fg_activity", name: "customer_activity", type: "feature-group", owner: "ml-platform", updated: minutesAgo(18) },
    { id: "mdl_churn", name: "churn_predictor_v3", type: "model", owner: "ds-team", updated: daysAgo(2) },
    { id: "ep_churn", name: "/predict/churn", type: "endpoint", owner: "ml-platform", updated: daysAgo(2) },
  ];
  const edges: LineageEdge[] = [
    { source: "src_pg", target: "pl_orders" },
    { source: "src_kafka", target: "pl_c360" },
    { source: "src_pg", target: "pl_c360" },
    { source: "pl_orders", target: "ds_orders" },
    { source: "pl_c360", target: "ds_c360" },
    { source: "ds_orders", target: "fg_activity" },
    { source: "ds_c360", target: "fg_activity" },
    { source: "fg_activity", target: "mdl_churn" },
    { source: "mdl_churn", target: "ep_churn" },
  ];
  // Ensure the searched asset is present even if not in the canonical graph.
  if (!nodes.some((n) => n.id === assetId)) {
    const hit = SEARCH_ASSETS.find((a) => a.id === assetId);
    if (hit) nodes.push(hit);
  }
  return { nodes, edges };
}

export async function getLineageImpact(assetId: string) {
  await delay(300);
  const downstream: Record<string, { id: string; name: string; type: LineageType; distance: number }[]> = {
    ds_orders: [
      { id: "fg_activity", name: "customer_activity", type: "feature-group", distance: 1 },
      { id: "mdl_churn", name: "churn_predictor_v3", type: "model", distance: 2 },
      { id: "ep_churn", name: "/predict/churn", type: "endpoint", distance: 3 },
    ],
    src_pg: [
      { id: "pl_orders", name: "orders_daily_agg", type: "pipeline", distance: 1 },
      { id: "ds_orders", name: "analytics.orders_daily", type: "dataset", distance: 2 },
      { id: "fg_activity", name: "customer_activity", type: "feature-group", distance: 3 },
    ],
  };
  return { affected_assets: downstream[assetId] ?? [] };
}

// ---------------------------------------------------------------------------
// Write endpoints
// ---------------------------------------------------------------------------

export async function createPipeline(_body: unknown): Promise<{ pipeline_id: string }> {
  await delay(700);
  return { pipeline_id: uid("pl") };
}

export interface TestRunResult {
  status: "passed" | "failed";
  quality_results: { check: string; passed: boolean; failed_rows: number }[];
}

export async function testRunPipeline(body: { checks: { column: string; type: string }[] }): Promise<TestRunResult> {
  await delay(900);
  const results = (body.checks.length ? body.checks : [{ column: "id", type: "Not null" }]).map((c, i) => {
    const failed_rows = i === 0 ? 0 : Math.floor(Math.random() * 40);
    return { check: `${c.type} · ${c.column || "—"}`, passed: failed_rows === 0, failed_rows };
  });
  return { status: results.every((r) => r.passed) ? "passed" : "failed", quality_results: results };
}

export async function detectSchema(storagePath: string): Promise<{ columns: { name: string; type: string }[]; pii_suspects: string[] }> {
  await delay(700);
  return {
    columns: [
      { name: "customer_id", type: "string" },
      { name: "email", type: "string" },
      { name: "full_name", type: "string" },
      { name: "signup_date", type: "date" },
      { name: "lifetime_value", type: "float" },
      { name: "region", type: "string" },
      { name: `# from ${storagePath.split("/").pop() || "source"}`, type: "meta" },
    ].filter((c) => c.type !== "meta"),
    pii_suspects: ["email", "full_name"],
  };
}

export async function publishDataset(_body: unknown): Promise<{ dataset_id: string }> {
  await delay(700);
  return { dataset_id: uid("ds") };
}

export async function createFeatureGroup(_body: unknown): Promise<{ group_id: string }> {
  await delay(600);
  return { group_id: uid("fg") };
}

export async function refreshFeatureGroup(_id: string): Promise<{ job_id: string }> {
  await delay(500);
  return { job_id: uid("job") };
}

export async function getPipelines_forSelect() {
  await delay(150);
  return PIPELINES.map((p) => ({ id: p.id, name: p.name }));
}
