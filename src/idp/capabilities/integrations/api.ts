import { delay, hoursAgo, minutesAgo } from "../../api/client";

/**
 * Capability 3.2 — Platform Integrations (persona-parameterized mock).
 *
 * ONE persona-aware screen: `getIntegrations(persona)` returns the pre-built
 * connections to that persona's external tools, plus the data each integration
 * surfaces inside the IDP (the "live widget") and its (masked) config. Write
 * endpoints (`testIntegration`, `setIntegrationEnabled`) return plausible
 * status objects and are wired to toasts in the screen.
 */

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: "Connected" | "Disconnected" | "Degraded";
  last_sync: string;
  /** the live data this integration surfaces inside the IDP */
  surfaced: { label: string; value: string }[];
  /** connection config (values may be masked like "••••") */
  config: { label: string; value: string }[];
}

const INTEGRATIONS: Record<string, Integration[]> = {
  "ai-engineer": [
    {
      id: "int_anthropic",
      name: "Anthropic",
      category: "LLM provider",
      status: "Connected",
      last_sync: minutesAgo(3),
      surfaced: [
        { label: "Tokens today", value: "4.2M" },
        { label: "Cost / call", value: "$0.0091" },
        { label: "Model", value: "claude-3.5-sonnet" },
      ],
      config: [
        { label: "Base URL", value: "https://api.anthropic.com" },
        { label: "API key", value: "sk-ant-••••4f9a" },
        { label: "Org", value: "applied-ai" },
      ],
    },
    {
      id: "int_vertex",
      name: "Vertex AI",
      category: "LLM provider",
      status: "Connected",
      last_sync: minutesAgo(8),
      surfaced: [
        { label: "Tokens today", value: "1.1M" },
        { label: "Cost / call", value: "$0.0043" },
        { label: "Region", value: "us-central1" },
      ],
      config: [
        { label: "Project", value: "applied-ai-prod" },
        { label: "Service account", value: "vertex-sa@••••.iam" },
      ],
    },
    {
      id: "int_openai",
      name: "OpenAI",
      category: "LLM provider",
      status: "Degraded",
      last_sync: minutesAgo(22),
      surfaced: [
        { label: "Tokens today", value: "820K" },
        { label: "Cost / call", value: "$0.0021" },
        { label: "Provider status", value: "Elevated latency" },
      ],
      config: [
        { label: "Base URL", value: "https://api.openai.com/v1" },
        { label: "API key", value: "sk-••••1c7d" },
      ],
    },
    {
      id: "int_pinecone",
      name: "Pinecone",
      category: "Vector store",
      status: "Connected",
      last_sync: minutesAgo(5),
      surfaced: [
        { label: "Vectors", value: "12.4M" },
        { label: "Index", value: "support-kb" },
        { label: "p95 query", value: "38ms" },
      ],
      config: [
        { label: "Environment", value: "us-east-1-aws" },
        { label: "API key", value: "pc-••••9b2e" },
      ],
    },
    {
      id: "int_langfuse",
      name: "Langfuse",
      category: "Tracing / observability",
      status: "Connected",
      last_sync: minutesAgo(1),
      surfaced: [
        { label: "Traces today", value: "18,204" },
        { label: "Avg latency", value: "1.4s" },
        { label: "Error rate", value: "0.6%" },
      ],
      config: [
        { label: "Host", value: "https://cloud.langfuse.com" },
        { label: "Public key", value: "pk-lf-••••" },
        { label: "Secret key", value: "sk-lf-••••" },
      ],
    },
    {
      id: "int_lakera",
      name: "Lakera Guard",
      category: "Guardrail service",
      status: "Connected",
      last_sync: minutesAgo(12),
      surfaced: [
        { label: "Requests today", value: "9,110" },
        { label: "Blocked", value: "37" },
        { label: "Policies", value: "5 active" },
      ],
      config: [
        { label: "Endpoint", value: "https://api.lakera.ai" },
        { label: "API key", value: "lk-••••7a1c" },
      ],
    },
  ],
  "agentic-engineer": [
    {
      id: "int_agent_runtime",
      name: "Claude Agent SDK",
      category: "Agent runtime",
      status: "Connected",
      last_sync: minutesAgo(2),
      surfaced: [
        { label: "Active runs", value: "14" },
        { label: "Run traces (24h)", value: "1,208" },
        { label: "Success rate", value: "93%" },
      ],
      config: [
        { label: "Runtime", value: "claude-agent-runtime" },
        { label: "API key", value: "sk-ant-••••4f9a" },
        { label: "Autonomy budget", value: "Medium" },
      ],
    },
    {
      id: "int_agent_registry",
      name: "Agent Registry",
      category: "Agent registry",
      status: "Connected",
      last_sync: minutesAgo(15),
      surfaced: [
        { label: "Registered agents", value: "27" },
        { label: "In prod", value: "9" },
        { label: "Awaiting approval", value: "3" },
      ],
      config: [
        { label: "Registry URL", value: "https://registry.agents.internal" },
        { label: "Token", value: "reg-••••2f8b" },
      ],
    },
    {
      id: "int_mcp_gateway",
      name: "MCP Tool Gateway",
      category: "Tool gateway",
      status: "Connected",
      last_sync: minutesAgo(4),
      surfaced: [
        { label: "Tool calls (24h)", value: "42,910" },
        { label: "Registered tools", value: "31" },
        { label: "Denied", value: "84" },
      ],
      config: [
        { label: "Gateway URL", value: "https://mcp.gateway.internal" },
        { label: "Auth token", value: "mcp-••••c3d1" },
      ],
    },
    {
      id: "int_checkpoint",
      name: "Checkpoint Queue",
      category: "Checkpoint / HITL",
      status: "Degraded",
      last_sync: minutesAgo(30),
      surfaced: [
        { label: "Pending approvals", value: "6" },
        { label: "Oldest waiting", value: "38m" },
        { label: "Auto-expired", value: "2" },
      ],
      config: [
        { label: "Queue", value: "checkpoints.hitl" },
        { label: "Webhook", value: "https://hooks.internal/••••" },
      ],
    },
    {
      id: "int_agent_tracing",
      name: "Langfuse",
      category: "Tracing / observability",
      status: "Connected",
      last_sync: minutesAgo(1),
      surfaced: [
        { label: "Run traces today", value: "1,208" },
        { label: "Avg steps / run", value: "7.2" },
        { label: "Failed steps", value: "1.9%" },
      ],
      config: [
        { label: "Host", value: "https://cloud.langfuse.com" },
        { label: "Public key", value: "pk-lf-••••" },
      ],
    },
    {
      id: "int_agent_provider",
      name: "Anthropic",
      category: "Model provider",
      status: "Connected",
      last_sync: minutesAgo(6),
      surfaced: [
        { label: "Tokens today", value: "6.8M" },
        { label: "Provider status", value: "Operational" },
        { label: "Model", value: "claude-3.5-sonnet" },
      ],
      config: [
        { label: "Base URL", value: "https://api.anthropic.com" },
        { label: "API key", value: "sk-ant-••••4f9a" },
      ],
    },
  ],
  "data-scientist": [
    {
      id: "int_vertex_training",
      name: "Vertex AI Training",
      category: "Training platform",
      status: "Connected",
      last_sync: minutesAgo(9),
      surfaced: [
        { label: "Running jobs", value: "2" },
        { label: "Queued", value: "1" },
        { label: "Last job", value: "Succeeded" },
      ],
      config: [
        { label: "Project", value: "ds-platform-prod" },
        { label: "Region", value: "us-central1" },
        { label: "Service account", value: "train-sa@••••.iam" },
      ],
    },
    {
      id: "int_mlflow",
      name: "MLflow",
      category: "Experiment tracker",
      status: "Connected",
      last_sync: minutesAgo(4),
      surfaced: [
        { label: "Experiments", value: "48" },
        { label: "Best AUC", value: "0.947" },
        { label: "Runs (7d)", value: "312" },
      ],
      config: [
        { label: "Tracking URI", value: "https://mlflow.internal" },
        { label: "Token", value: "mlf-••••8d2a" },
      ],
    },
    {
      id: "int_model_registry",
      name: "Model Registry",
      category: "Model registry",
      status: "Connected",
      last_sync: minutesAgo(20),
      surfaced: [
        { label: "Registered models", value: "23" },
        { label: "In prod", value: "6" },
        { label: "Pending approval", value: "2" },
      ],
      config: [
        { label: "Registry URI", value: "https://registry.ml.internal" },
        { label: "Token", value: "reg-••••2f8b" },
      ],
    },
    {
      id: "int_gcs_datasets",
      name: "GCS Dataset Storage",
      category: "Dataset storage",
      status: "Connected",
      last_sync: hoursAgo(1),
      surfaced: [
        { label: "Datasets", value: "141" },
        { label: "Total size", value: "4.7 TB" },
        { label: "Latest", value: "customer-churn-2026" },
      ],
      config: [
        { label: "Bucket", value: "gs://ds-datasets-prod" },
        { label: "Service account", value: "ds-sa@••••.iam" },
      ],
    },
    {
      id: "int_notebooks",
      name: "Vertex Workbench",
      category: "Notebooks",
      status: "Connected",
      last_sync: minutesAgo(11),
      surfaced: [
        { label: "Active notebooks", value: "5" },
        { label: "Idle > 24h", value: "2" },
        { label: "GPU instances", value: "1" },
      ],
      config: [
        { label: "Project", value: "ds-platform-prod" },
        { label: "Zone", value: "us-central1-a" },
      ],
    },
  ],
  "app-engineer": [
    {
      id: "int_argocd",
      name: "Argo CD",
      category: "GitOps controller",
      status: "Connected",
      last_sync: minutesAgo(2),
      surfaced: [
        { label: "Apps synced", value: "34 / 36" },
        { label: "Out of sync", value: "2" },
        { label: "Sync status", value: "Healthy" },
      ],
      config: [
        { label: "Server", value: "https://argocd.internal" },
        { label: "Token", value: "argo-••••6b3f" },
      ],
    },
    {
      id: "int_terraform",
      name: "Terraform Cloud",
      category: "Infra provisioner",
      status: "Connected",
      last_sync: minutesAgo(18),
      surfaced: [
        { label: "Workspaces", value: "21" },
        { label: "Resource state", value: "Applied" },
        { label: "Pending runs", value: "1" },
      ],
      config: [
        { label: "Org", value: "platform-eng" },
        { label: "Token", value: "tfc-••••9e1a" },
      ],
    },
    {
      id: "int_kong",
      name: "Kong",
      category: "API gateway",
      status: "Connected",
      last_sync: minutesAgo(6),
      surfaced: [
        { label: "Routes", value: "128" },
        { label: "Route config", value: "In sync" },
        { label: "5xx rate", value: "0.3%" },
      ],
      config: [
        { label: "Admin URL", value: "https://kong-admin.internal" },
        { label: "API key", value: "kong-••••2c8d" },
      ],
    },
    {
      id: "int_gcr",
      name: "Container Registry",
      category: "Container registry",
      status: "Connected",
      last_sync: hoursAgo(2),
      surfaced: [
        { label: "Images", value: "412" },
        { label: "Latest push", value: "checkout-api:v1.4.0" },
        { label: "Vulnerabilities", value: "3 medium" },
      ],
      config: [
        { label: "Registry", value: "gcr.io/platform-eng" },
        { label: "Service account", value: "gcr-sa@••••.iam" },
      ],
    },
    {
      id: "int_vault",
      name: "HashiCorp Vault",
      category: "Secrets manager",
      status: "Connected",
      last_sync: minutesAgo(7),
      surfaced: [
        { label: "Secrets", value: "286" },
        { label: "Deploy health", value: "Healthy" },
        { label: "Leases active", value: "54" },
      ],
      config: [
        { label: "Address", value: "https://vault.internal:8200" },
        { label: "Token", value: "hvs-••••4d7e" },
      ],
    },
  ],
  mlops: [
    {
      id: "int_vertex_pipelines",
      name: "Vertex AI Pipelines",
      category: "Training platform",
      status: "Connected",
      last_sync: minutesAgo(10),
      surfaced: [
        { label: "Last run", value: "Succeeded" },
        { label: "Running", value: "1" },
        { label: "Failed (24h)", value: "1" },
      ],
      config: [
        { label: "Project", value: "ml-platform-prod" },
        { label: "Region", value: "us-central1" },
      ],
    },
    {
      id: "int_prometheus",
      name: "Prometheus",
      category: "Monitoring",
      status: "Connected",
      last_sync: minutesAgo(1),
      surfaced: [
        { label: "Targets up", value: "142 / 144" },
        { label: "Compute util", value: "71%" },
        { label: "Series", value: "2.1M" },
      ],
      config: [
        { label: "Endpoint", value: "https://prometheus.internal" },
        { label: "Scrape interval", value: "15s" },
      ],
    },
    {
      id: "int_pagerduty",
      name: "PagerDuty",
      category: "Alerting",
      status: "Connected",
      last_sync: minutesAgo(14),
      surfaced: [
        { label: "Open alerts", value: "2" },
        { label: "Alert history (24h)", value: "9" },
        { label: "MTTA", value: "4m" },
      ],
      config: [
        { label: "Service", value: "ml-platform" },
        { label: "Integration key", value: "pd-••••3a9c" },
      ],
    },
    {
      id: "int_scheduler",
      name: "Kueue Scheduler",
      category: "Compute scheduler",
      status: "Connected",
      last_sync: minutesAgo(5),
      surfaced: [
        { label: "Compute util", value: "68%" },
        { label: "Queued jobs", value: "4" },
        { label: "GPU nodes", value: "8 / 12" },
      ],
      config: [
        { label: "Cluster", value: "ml-training-gke" },
        { label: "Queue", value: "gpu-a100" },
      ],
    },
    {
      id: "int_drift",
      name: "Evidently",
      category: "Drift detection",
      status: "Degraded",
      last_sync: hoursAgo(2),
      surfaced: [
        { label: "Drift score", value: "0.71" },
        { label: "Monitors", value: "12" },
        { label: "Alerting", value: "3 critical" },
      ],
      config: [
        { label: "Endpoint", value: "https://evidently.internal" },
        { label: "Token", value: "ev-••••7b2d" },
      ],
    },
  ],
  security: [
    {
      id: "int_opa",
      name: "OPA / Gatekeeper",
      category: "Policy engine",
      status: "Connected",
      last_sync: minutesAgo(3),
      surfaced: [
        { label: "Violations (open)", value: "10" },
        { label: "Compliance score", value: "86%" },
        { label: "Policies", value: "42 enforced" },
      ],
      config: [
        { label: "Endpoint", value: "https://opa.internal" },
        { label: "Token", value: "opa-••••5c1e" },
      ],
    },
    {
      id: "int_audit_logs",
      name: "Audit Log Aggregator",
      category: "Audit-log aggregator",
      status: "Connected",
      last_sync: minutesAgo(1),
      surfaced: [
        { label: "Events (24h)", value: "1.4M" },
        { label: "Flagged", value: "23" },
        { label: "Retention", value: "400d" },
      ],
      config: [
        { label: "Sink", value: "audit-logs-prod" },
        { label: "Project", value: "security-prod" },
      ],
    },
    {
      id: "int_iam",
      name: "Cloud IAM",
      category: "IAM",
      status: "Connected",
      last_sync: minutesAgo(12),
      surfaced: [
        { label: "Access anomalies", value: "4" },
        { label: "Over-privileged", value: "7" },
        { label: "Principals", value: "512" },
      ],
      config: [
        { label: "Org", value: "org/847213" },
        { label: "Service account", value: "sec-sa@••••.iam" },
      ],
    },
    {
      id: "int_scanner",
      name: "Trivy",
      category: "Vulnerability scanner",
      status: "Connected",
      last_sync: hoursAgo(1),
      surfaced: [
        { label: "Critical CVEs", value: "3" },
        { label: "High CVEs", value: "11" },
        { label: "Images scanned", value: "412" },
      ],
      config: [
        { label: "Endpoint", value: "https://trivy.internal" },
        { label: "Token", value: "trv-••••9d4f" },
      ],
    },
    {
      id: "int_siem",
      name: "Splunk SIEM",
      category: "SIEM",
      status: "Degraded",
      last_sync: minutesAgo(26),
      surfaced: [
        { label: "Notable events", value: "18" },
        { label: "Ingest lag", value: "4m" },
        { label: "Correlation rules", value: "96" },
      ],
      config: [
        { label: "Host", value: "https://splunk.internal:8089" },
        { label: "HEC token", value: "hec-••••2e7a" },
      ],
    },
  ],
  "data-engineer": [
    {
      id: "int_airflow",
      name: "Apache Airflow",
      category: "Orchestrator",
      status: "Connected",
      last_sync: minutesAgo(4),
      surfaced: [
        { label: "DAG status", value: "34 healthy" },
        { label: "Failed (24h)", value: "1" },
        { label: "Running", value: "3" },
      ],
      config: [
        { label: "Webserver", value: "https://airflow.internal" },
        { label: "API token", value: "af-••••6c2b" },
      ],
    },
    {
      id: "int_datahub",
      name: "DataHub",
      category: "Data catalog",
      status: "Connected",
      last_sync: minutesAgo(16),
      surfaced: [
        { label: "Datasets", value: "1,204" },
        { label: "Owned", value: "88" },
        { label: "Stale docs", value: "12" },
      ],
      config: [
        { label: "GMS URL", value: "https://datahub.internal" },
        { label: "Token", value: "dh-••••4a8e" },
      ],
    },
    {
      id: "int_feast",
      name: "Feast Feature Store",
      category: "Feature store",
      status: "Connected",
      last_sync: minutesAgo(18),
      surfaced: [
        { label: "Feature groups", value: "47" },
        { label: "Feature freshness", value: "18m" },
        { label: "Serving p95", value: "22ms" },
      ],
      config: [
        { label: "Registry", value: "gs://feast-registry-prod" },
        { label: "Online store", value: "redis://••••" },
      ],
    },
    {
      id: "int_dq",
      name: "Great Expectations",
      category: "DQ engine",
      status: "Degraded",
      last_sync: hoursAgo(1),
      surfaced: [
        { label: "DQ results", value: "63% pass" },
        { label: "Suites", value: "58" },
        { label: "Failing checks", value: "9" },
      ],
      config: [
        { label: "Store", value: "gs://ge-store-prod" },
        { label: "Token", value: "ge-••••1f7c" },
      ],
    },
    {
      id: "int_lineage",
      name: "OpenLineage",
      category: "Lineage tracker",
      status: "Connected",
      last_sync: minutesAgo(7),
      surfaced: [
        { label: "Tracked jobs", value: "312" },
        { label: "Lineage edges", value: "4,102" },
        { label: "Orphaned", value: "5" },
      ],
      config: [
        { label: "Endpoint", value: "https://lineage.internal" },
        { label: "API key", value: "ol-••••8b3d" },
      ],
    },
    {
      id: "int_source_systems",
      name: "Source Systems (CDC)",
      category: "Source systems",
      status: "Connected",
      last_sync: minutesAgo(9),
      surfaced: [
        { label: "Connectors", value: "14" },
        { label: "Lag", value: "12s" },
        { label: "Rows / min", value: "84K" },
      ],
      config: [
        { label: "Platform", value: "Debezium / Kafka" },
        { label: "Bootstrap", value: "kafka.internal:9092" },
      ],
    },
  ],
};

export async function getIntegrations(personaId: string): Promise<Integration[]> {
  await delay();
  return INTEGRATIONS[personaId] ?? [];
}

export async function testIntegration(id: string): Promise<{ status: string }> {
  await delay(700);
  return { status: `Connection test passed for ${id}` };
}

export async function setIntegrationEnabled(
  id: string,
  enabled: boolean
): Promise<{ status: string }> {
  await delay();
  return { status: enabled ? `Connected ${id}` : `Disconnected ${id}` };
}
