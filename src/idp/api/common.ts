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
    },
    {
      id: "n2",
      title: "Drift alert: churn-predictor",
      detail: "Feature `tenure_days` covariate drift 0.42 (critical)",
      created_at: minutesAgo(41),
      read: false,
      severity: "critical",
    },
    {
      id: "n3",
      title: "Deployment succeeded",
      detail: "checkout-api v2.8.1 synced to prod cluster",
      created_at: hoursAgo(2),
      read: true,
      severity: "info",
    },
  ];
}

export interface SearchResult {
  id: string;
  label: string;
  kind: "app" | "model" | "pipeline" | "policy" | "dataset" | "service";
  path: string;
}

const SEARCH_INDEX: SearchResult[] = [
  { id: "s1", label: "support-rag-bot", kind: "app", path: "/ai-engineer/observe/app_rag_1" },
  { id: "s2", label: "churn-predictor", kind: "model", path: "/data-scientist/models" },
  { id: "s3", label: "nightly-features", kind: "pipeline", path: "/data-engineer/dashboard" },
  { id: "s4", label: "require-resource-limits", kind: "policy", path: "/security/policies" },
  { id: "s5", label: "customer_events", kind: "dataset", path: "/data-scientist/datasets" },
  { id: "s6", label: "checkout-api", kind: "service", path: "/app-engineer/dashboard" },
];

/** GET /api/search?q= */
export async function globalSearch(q: string): Promise<SearchResult[]> {
  await delay(180);
  const query = q.trim().toLowerCase();
  if (!query) return [];
  return SEARCH_INDEX.filter(
    (r) => r.label.toLowerCase().includes(query) || r.kind.includes(query)
  );
}
