import { delay, hoursAgo, minutesAgo } from "./client";
import type { UserProfile } from "../types";

/** GET /api/user/profile */
export async function getProfile(): Promise<UserProfile> {
  await delay(200);
  return {
    name: "Pranav Joshipura",
    role: "Staff Platform Engineer",
    persona: "app-engineer",
    avatar_url: undefined,
  };
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  created_at: string;
  read: boolean;
  severity: "info" | "warning" | "critical";
  /** portal route this notification links to */
  url: string;
}

/** GET /api/notifications */
export async function getNotifications(): Promise<Notification[]> {
  await delay(260);
  return [
    {
      id: "n1",
      title: "Canary gate needs review",
      detail: "support-rag-bot v1.4.0-rc — faithfulness delta within review band",
      created_at: minutesAgo(8),
      read: false,
      severity: "warning",
      url: "/ai-engineer/canary/can_1",
    },
    {
      id: "n2",
      title: "Drift alert: churn-predictor",
      detail: "Feature `tenure_days` covariate drift 0.42 (critical)",
      created_at: minutesAgo(41),
      read: false,
      severity: "critical",
      url: "/mlops/drift/churn-predictor",
    },
    {
      id: "n3",
      title: "Deployment succeeded",
      detail: "checkout-api v2.8.1 synced to prod cluster",
      created_at: hoursAgo(2),
      read: true,
      severity: "info",
      url: "/app-engineer/dashboard",
    },
  ];
}

export interface SearchResult {
  id: string;
  label: string;
  kind: "app" | "model" | "pipeline" | "policy" | "dataset" | "service" | "template" | "agent" | "doc" | "screen";
  path: string;
  /** persona this result belongs to (shown as a chip) */
  persona?: string;
}

// Cross-portal search index (spec top bar). Paths are real root-level routes.
const SEARCH_INDEX: SearchResult[] = [
  { id: "s1", label: "support-rag-bot", kind: "app", path: "/ai-engineer/observe/app_rag_1", persona: "ai-engineer" },
  { id: "s2", label: "churn-predictor", kind: "model", path: "/data-scientist/models", persona: "data-scientist" },
  { id: "s3", label: "nightly-features", kind: "pipeline", path: "/data-engineer/pipelines/new", persona: "data-engineer" },
  { id: "s4", label: "require-resource-limits", kind: "policy", path: "/security/policies", persona: "security" },
  { id: "s5", label: "customer_events", kind: "dataset", path: "/data-scientist/datasets", persona: "data-scientist" },
  { id: "s6", label: "checkout-api", kind: "service", path: "/app-engineer/dashboard", persona: "app-engineer" },
  { id: "s7", label: "ReAct agent scaffold", kind: "template", path: "/templates/react-agent-scaffold", persona: "agentic-engineer" },
  { id: "s8", label: "RAG quality auditor", kind: "agent", path: "/agents/rag-quality-auditor", persona: "ai-engineer" },
  { id: "s9", label: "Score spec v2 guide", kind: "doc", path: "/docs/score-spec-v2", persona: "app-engineer" },
  { id: "s10", label: "Runaway execution detector", kind: "agent", path: "/agents/runaway-execution-detector", persona: "agentic-engineer" },
  { id: "s11", label: "Drift Monitor", kind: "screen", path: "/mlops/drift/churn-predictor", persona: "mlops" },
  { id: "s12", label: "Feature Store", kind: "screen", path: "/data-engineer/features", persona: "data-engineer" },
];

/** GET /api/search?q= */
export async function globalSearch(q: string): Promise<SearchResult[]> {
  await delay(180);
  const query = q.trim().toLowerCase();
  if (!query) return [];
  return SEARCH_INDEX.filter(
    (r) => r.label.toLowerCase().includes(query) || r.kind.includes(query)
  ).slice(0, 8);
}
