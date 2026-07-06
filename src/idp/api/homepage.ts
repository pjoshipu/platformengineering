import { delay } from "./client";

/**
 * Mock API for the IDP homepage (the front door). All data is persona-aware
 * where the spec calls for it; every `url` is a real portal route so nothing on
 * the homepage is a dead end. Follows the shared mock pattern (artificial delay,
 * consumed via useMockQuery).
 */

export type DotColor = "amber" | "red" | "green" | "gray";

export interface ActivityItem {
  id: string;
  dot_color: DotColor;
  title: string;
  subtitle: string;
  url: string;
}

export interface QuickAction {
  /** icon key mapped to a lucide icon in the Home component */
  icon: string;
  label: string;
  url: string;
}

export type FeedTag = "New agent" | "Template" | "Docs" | "Announcement";

export interface FeedItem {
  id: string;
  tag: FeedTag;
  title: string;
  subtitle: string;
  url: string;
}

export interface JourneyStep {
  label: string;
  url: string;
}

export interface Journey {
  id: string;
  title: string;
  /** icon key mapped to a lucide icon in the Home component */
  icon: string;
  steps: JourneyStep[];
  /** persona ids for which this journey is highlighted */
  highlighted_for: string[];
}

// ---------------------------------------------------------------------------
// Per-persona quick actions (spec §2). URLs resolve to real routes; param
// screens get a representative id so they never 404.
// ---------------------------------------------------------------------------

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  "ai-engineer": [
    { icon: "rocket", label: "Deploy LLM app", url: "/ai-engineer/deploy" },
    { icon: "type", label: "Update prompt", url: "/ai-engineer/prompts/app_rag_1" },
    { icon: "eye", label: "Observability", url: "/ai-engineer/observe/app_rag_1" },
    { icon: "play", label: "Run agent", url: "/agents/marketplace" },
  ],
  "agentic-engineer": [
    { icon: "git-branch", label: "Build agent", url: "/agents/build" },
    { icon: "plug", label: "Register tool", url: "/agents/tools" },
    { icon: "activity", label: "Monitor runs", url: "/agents/executions" },
    { icon: "shield", label: "Safety audit", url: "/security/policies" },
  ],
  "data-scientist": [
    { icon: "play", label: "New training job", url: "/data-scientist/request" },
    { icon: "database", label: "Browse datasets", url: "/data-scientist/datasets" },
    { icon: "flask", label: "Experiments", url: "/data-scientist/experiments" },
    { icon: "check", label: "Approve model", url: "/data-scientist/models" },
  ],
  "app-engineer": [
    { icon: "rocket", label: "Deploy service", url: "/app-engineer/deploy" },
    { icon: "git-branch", label: "View GitOps", url: "/app-engineer/gitops" },
    { icon: "server", label: "Provision infra", url: "/app-engineer/infrastructure" },
    { icon: "heart", label: "Check health", url: "/app-engineer/dashboard" },
  ],
  "mlops": [
    { icon: "play", label: "Trigger pipeline", url: "/mlops/pipelines" },
    { icon: "activity", label: "Check drift", url: "/mlops/drift/churn-predictor" },
    { icon: "settings", label: "Edit retrain rule", url: "/mlops/retraining-rules" },
    { icon: "cpu", label: "GPU usage", url: "/mlops/dashboard" },
  ],
  "security": [
    { icon: "scan", label: "Run policy scan", url: "/security/policies" },
    { icon: "alert", label: "View violations", url: "/security/dashboard" },
    { icon: "download", label: "Export audit", url: "/security/audit" },
    { icon: "user-x", label: "Revoke access", url: "/security/audit" },
  ],
  "data-engineer": [
    { icon: "play", label: "Run pipeline", url: "/data-engineer/pipelines/new" },
    { icon: "upload", label: "Publish dataset", url: "/data-engineer/publish" },
    { icon: "refresh", label: "Refresh features", url: "/data-engineer/features" },
    { icon: "git-branch", label: "View lineage", url: "/data-engineer/lineage" },
  ],
};

// ---------------------------------------------------------------------------
// Per-persona activity (spec §2 "Your activity"). Four items each.
// ---------------------------------------------------------------------------

const ACTIVITY: Record<string, ActivityItem[]> = {
  "ai-engineer": [
    { id: "a1", dot_color: "amber", title: "support-rag-agent canary", subtitle: "Running · 20% traffic · 12m ago", url: "/ai-engineer/canary/cn_1" },
    { id: "a2", dot_color: "red", title: "Approval pending", subtitle: "churn-model-v3 → prod", url: "/data-scientist/models" },
    { id: "a3", dot_color: "green", title: "api-gateway deployed", subtitle: "Healthy · 2h ago", url: "/app-engineer/dashboard" },
    { id: "a4", dot_color: "green", title: "Prompt v1.4.0 live", subtitle: "AUC 0.91 · 3h ago", url: "/ai-engineer/prompts/app_rag_1" },
  ],
  "agentic-engineer": [
    { id: "a1", dot_color: "red", title: "3 runaway executions today", subtitle: "cost-analyzer agent · needs review", url: "/agents/executions" },
    { id: "a2", dot_color: "amber", title: "code-review-agent running", subtitle: "Step 4 of 12 · 2m elapsed", url: "/agents/executions" },
    { id: "a3", dot_color: "green", title: "tool-permission-audit done", subtitle: "0 violations found · 1h ago", url: "/agents/safety" },
    { id: "a4", dot_color: "green", title: "agent-v2.1.0 deployed", subtitle: "Staging · safety check passed", url: "/agents/marketplace" },
  ],
  "data-scientist": [
    { id: "a1", dot_color: "amber", title: "churn-model training", subtitle: "Epoch 34 of 50 · AUC 0.87 · 28m", url: "/data-scientist/experiments" },
    { id: "a2", dot_color: "red", title: "Model approval needed", subtitle: "fraud-detector-v4 → prod", url: "/data-scientist/models" },
    { id: "a3", dot_color: "green", title: "Experiment exp-042 complete", subtitle: "Best AUC 0.891 · 3h ago", url: "/data-scientist/experiments" },
    { id: "a4", dot_color: "gray", title: "Dataset access granted", subtitle: "gs://crm/q2-2026 · 5h ago", url: "/data-scientist/datasets" },
  ],
  "app-engineer": [
    { id: "a1", dot_color: "red", title: "2 GitOps sync errors", subtitle: "payment-svc · namespace prod", url: "/app-engineer/gitops" },
    { id: "a2", dot_color: "green", title: "api-gateway-v2 deployed", subtitle: "Healthy · 45m ago", url: "/app-engineer/dashboard" },
    { id: "a3", dot_color: "amber", title: "Cloud SQL provisioning", subtitle: "Crossplane · ETA 3m", url: "/app-engineer/infrastructure" },
    { id: "a4", dot_color: "green", title: "Kong route created", subtitle: "/api/predict/* · 2h ago", url: "/app-engineer/gitops" },
  ],
  "mlops": [
    { id: "a1", dot_color: "red", title: "Drift alert: churn-model", subtitle: "Score 0.34 · threshold 0.20", url: "/mlops/drift/churn-predictor" },
    { id: "a2", dot_color: "amber", title: "weekly-retrain-pipeline running", subtitle: "Step 3 of 8 · 18m elapsed", url: "/mlops/pipelines" },
    { id: "a3", dot_color: "green", title: "Pipeline fraud-detect done", subtitle: "AUC stable · 4h ago", url: "/mlops/pipelines" },
    { id: "a4", dot_color: "green", title: "GPU utilisation 71%", subtitle: "3 jobs running · healthy", url: "/mlops/dashboard" },
  ],
  "security": [
    { id: "a1", dot_color: "red", title: "3 policy violations today", subtitle: "namespace prod · high severity", url: "/security/dashboard" },
    { id: "a2", dot_color: "red", title: "Agent safety violation", subtitle: "code-agent tried file write · blocked", url: "/security/dashboard" },
    { id: "a3", dot_color: "green", title: "Compliance scan done", subtitle: "94% compliant · 2h ago", url: "/security/policies" },
    { id: "a4", dot_color: "gray", title: "PII scanner ran", subtitle: "2 datasets flagged for review", url: "/security/audit" },
  ],
  "data-engineer": [
    { id: "a1", dot_color: "red", title: "Quality check failed", subtitle: "crm-pipeline · 4.2% null rate", url: "/data-engineer/pipelines/new" },
    { id: "a2", dot_color: "amber", title: "etl-crm-daily running", subtitle: "Step 5 of 9 · 1.2M rows processed", url: "/data-engineer/pipelines/new" },
    { id: "a3", dot_color: "green", title: "Dataset published", subtitle: "gs://products/q2 · catalog updated", url: "/data-engineer/publish" },
    { id: "a4", dot_color: "green", title: "Feature store refreshed", subtitle: "customer-features · 3h ago", url: "/data-engineer/features" },
  ],
};

// ---------------------------------------------------------------------------
// Static platform feed (spec §2, not persona-dependent).
// ---------------------------------------------------------------------------

const FEED: FeedItem[] = [
  { id: "f1", tag: "New agent", title: "Runaway execution detector", subtitle: "Agentic Engineer · just now", url: "/agents/runaway-execution-detector" },
  { id: "f2", tag: "Template", title: "ReAct agent scaffold", subtitle: "Agentic Engineer · 1h ago", url: "/templates/react-agent-scaffold" },
  { id: "f3", tag: "New agent", title: "RAG quality auditor", subtitle: "AI Engineer · 4h ago", url: "/agents/rag-quality-auditor" },
  { id: "f4", tag: "Docs", title: "Score spec v2 guide published", subtitle: "Platform Engineer · 1d ago", url: "/docs/score-spec-v2" },
];

// ---------------------------------------------------------------------------
// Journeys (spec §3 + Connection 6). highlighted_for uses persona ids and is
// derived from the spec's PERSONA → HIGHLIGHTED JOURNEYS mapping.
// ---------------------------------------------------------------------------

export const JOURNEYS: Journey[] = [
  {
    id: "J1", title: "Ship an AI-powered feature", icon: "robot",
    steps: [
      { label: "Define spec", url: "/ai-engineer/deploy" },
      { label: "Deploy model", url: "/data-scientist/models" },
      { label: "Ship via IDP", url: "/app-engineer/deploy" },
    ],
    highlighted_for: ["ai-engineer", "agentic-engineer", "data-scientist", "app-engineer"],
  },
  {
    id: "J2", title: "Build an autonomous agent", icon: "infinity",
    steps: [
      { label: "Design graph", url: "/agents/build" },
      { label: "Register tools", url: "/agents/tools" },
      { label: "Deploy with safety", url: "/agents/marketplace" },
    ],
    highlighted_for: ["agentic-engineer", "ai-engineer", "security"],
  },
  {
    id: "J3", title: "Get a dataset to production", icon: "database",
    steps: [
      { label: "Build pipeline", url: "/data-engineer/pipelines/new" },
      { label: "Pass quality gate", url: "/data-engineer/pipelines/new" },
      { label: "Publish to catalog", url: "/data-engineer/publish" },
    ],
    highlighted_for: ["data-engineer", "data-scientist", "mlops"],
  },
  {
    id: "J4", title: "Monitor and retrain a model", icon: "refresh",
    steps: [
      { label: "Check drift", url: "/mlops/drift/churn-predictor" },
      { label: "Trigger retraining", url: "/data-scientist/request" },
      { label: "Promote version", url: "/data-scientist/models" },
    ],
    highlighted_for: ["mlops", "data-scientist", "data-engineer"],
  },
  {
    id: "J5", title: "Audit platform compliance", icon: "shield",
    steps: [
      { label: "Run policy scan", url: "/security/policies" },
      { label: "Review violations", url: "/security/dashboard" },
      { label: "Export evidence", url: "/security/audit" },
    ],
    highlighted_for: ["security"],
  },
  {
    id: "J6", title: "Deploy a new service", icon: "server",
    steps: [
      { label: "Write Score spec", url: "/app-engineer/deploy" },
      { label: "Provision infra", url: "/app-engineer/infrastructure" },
      { label: "GitOps syncs", url: "/app-engineer/gitops" },
    ],
    highlighted_for: ["app-engineer"],
  },
];

/** Agent counts per persona tile (spec Connection 9). */
const AGENT_COUNTS: Record<string, number> = {
  "ai-engineer": 6,
  "agentic-engineer": 8,
  "data-scientist": 7,
  "app-engineer": 7,
  "mlops": 6,
  "security": 7,
  "data-engineer": 7,
};

const DEFAULT_QUICK = QUICK_ACTIONS["ai-engineer"];
const DEFAULT_ACTIVITY = ACTIVITY["ai-engineer"];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function getQuickActions(persona: string): Promise<QuickAction[]> {
  await delay(120);
  return QUICK_ACTIONS[persona] ?? DEFAULT_QUICK;
}

export async function getActivity(persona: string): Promise<ActivityItem[]> {
  await delay(160);
  return (ACTIVITY[persona] ?? DEFAULT_ACTIVITY).slice(0, 4);
}

export async function getFeed(): Promise<FeedItem[]> {
  await delay(140);
  return FEED;
}

export async function getJourneys(): Promise<Journey[]> {
  await delay(120);
  return JOURNEYS;
}

export async function getAgentCount(persona: string): Promise<{ count: number }> {
  await delay(100);
  return { count: AGENT_COUNTS[persona] ?? 0 };
}

export function getJourney(id: string): Journey | undefined {
  return JOURNEYS.find((j) => j.id === id);
}
