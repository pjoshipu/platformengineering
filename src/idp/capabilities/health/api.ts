import { delay } from "../../api/client";

/**
 * Capability 1.4 — Service Health Metrics (persona-parameterized mock).
 *
 * ONE health screen, persona-aware. `getHealthAssets(persona)` lists the
 * persona's monitored assets (names reused from the software catalog for
 * consistency); `getHealthMetrics(persona, asset, range)` returns the
 * persona-specific current metric cards; `getHealthSeries(persona, asset,
 * range)` returns 2–3 chart specs with generated timeseries. Mirrors the
 * catalog reference: persona-keyed mock + `CONFIG`-style `SERIES` builders.
 */

export interface HealthAsset {
  id: string;
  name: string;
  type: string;
}

export type MetricTone = "default" | "good" | "warning" | "poor";

export interface HealthCard {
  label: string;
  value: string;
  tone?: MetricTone;
}

export type ChartKind = "line" | "area" | "stacked";

export interface HealthChartSpec {
  id: string;
  title: string;
  kind: ChartKind;
  series: { key: string; label?: string }[];
  data: Record<string, unknown>[];
  threshold?: number;
}

export type TimeRange = "24h" | "7d" | "30d";

// --- Assets per persona -----------------------------------------------------

const ASSETS: Record<string, HealthAsset[]> = {
  "ai-engineer": [
    { id: "app_1", name: "support-rag", type: "RAG pipeline" },
    { id: "app_2", name: "docs-assistant", type: "RAG pipeline" },
    { id: "app_3", name: "sql-copilot", type: "Agent service" },
    { id: "app_5", name: "kb-embedder", type: "Embedding service" },
  ],
  "agentic-engineer": [
    { id: "ag_1", name: "support-triage-agent", type: "Agent" },
    { id: "ag_2", name: "infra-remediation-agent", type: "Agent" },
    { id: "ag_4", name: "release-captain", type: "Agent" },
    { id: "rt_1", name: "claude-agent-runtime", type: "Runtime" },
  ],
  "data-scientist": [
    { id: "mdl_churn", name: "churn-predictor", type: "Model" },
    { id: "mdl_fraud", name: "fraud-detection", type: "Model" },
    { id: "exp_recsys", name: "recsys-tower", type: "Experiment" },
    { id: "fg_activity", name: "customer_activity", type: "Feature group" },
  ],
  "app-engineer": [
    { id: "svc_1", name: "checkout-api", type: "Service" },
    { id: "svc_3", name: "inventory-svc", type: "Service" },
    { id: "svc_4", name: "notifications", type: "Service" },
    { id: "svc_2", name: "payments-gateway", type: "API" },
  ],
  mlops: [
    { id: "pl_1", name: "churn-training", type: "Pipeline" },
    { id: "pl_4", name: "ltv-training", type: "Pipeline" },
    { id: "ep_churn", name: "churn-serving", type: "Serving endpoint" },
    { id: "dm_churn", name: "churn-drift-monitor", type: "Drift monitor" },
  ],
  security: [
    { id: "svc_1", name: "checkout-api", type: "Service" },
    { id: "mdl_churn", name: "churn-predictor", type: "Model" },
    { id: "ds_churn", name: "customer-churn-2026", type: "Dataset" },
    { id: "pol_limits", name: "require-resource-limits", type: "Policy" },
  ],
  "data-engineer": [
    { id: "pl_1", name: "orders_daily_agg", type: "Data pipeline" },
    { id: "pl_7", name: "feature_churn_signals", type: "Data pipeline" },
    { id: "ds_orders", name: "analytics.orders_daily", type: "Dataset" },
    { id: "fg_activity", name: "customer_activity", type: "Feature group" },
  ],
};

// --- Deterministic-ish value generation -------------------------------------

/** Stable pseudo-random in [0,1) from a string seed (so charts don't flicker). */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** X-axis labels for a range: hour labels for 24h, day labels otherwise. */
function pointsForRange(range: TimeRange): string[] {
  if (range === "24h") {
    return Array.from({ length: 8 }, (_, i) => `${String(i * 3).padStart(2, "0")}:00`);
  }
  const n = range === "7d" ? 7 : 12; // 30d sampled into 12 buckets
  return Array.from({ length: n }, (_, i) => `D-${n - 1 - i}`);
}

/** Build a timeseries where each key wanders around a base value. */
function series(
  seed: string,
  range: TimeRange,
  keys: { key: string; base: number; amp: number; digits?: number }[]
): Record<string, unknown>[] {
  const labels = pointsForRange(range);
  return labels.map((ts, i) => {
    const row: Record<string, unknown> = { ts };
    for (const k of keys) {
      const rnd = seeded(`${seed}:${k.key}:${i}`)();
      const val = k.base + (rnd - 0.5) * 2 * k.amp;
      row[k.key] = Number(val.toFixed(k.digits ?? 2));
    }
    return row;
  });
}

// --- Public API -------------------------------------------------------------

export async function getHealthAssets(personaId: string): Promise<HealthAsset[]> {
  await delay();
  return ASSETS[personaId] ?? [];
}

export async function getHealthMetrics(
  personaId: string,
  assetId: string,
  range: TimeRange
): Promise<{ cards: HealthCard[] }> {
  await delay();
  const r = seeded(`${personaId}:${assetId}:${range}:cards`);
  const jitter = (base: number, spread: number, digits = 0) =>
    Number((base + (r() - 0.5) * 2 * spread).toFixed(digits));

  let cards: HealthCard[] = [];
  switch (personaId) {
    case "ai-engineer":
      cards = [
        { label: "p50 latency", value: `${jitter(420, 60)}ms` },
        { label: "p95 latency", value: `${jitter(980, 120)}ms`, tone: "warning" },
        { label: "p99 latency", value: `${jitter(1650, 200)}ms`, tone: "poor" },
        { label: "Error rate", value: `${jitter(0.8, 0.5, 2)}%`, tone: "good" },
        { label: "Faithfulness", value: `${jitter(0.93, 0.03, 2)}`, tone: "good" },
        { label: "Hallucination rate", value: `${jitter(3.2, 1.5, 1)}%`, tone: "warning" },
        { label: "Token usage", value: `${jitter(4.2, 0.8, 1)}M` },
        { label: "Cost / call", value: `$${jitter(0.012, 0.004, 3)}` },
        { label: "Guardrail trigger rate", value: `${jitter(2.1, 1, 1)}%`, tone: "warning" },
      ];
      break;
    case "agentic-engineer":
      cards = [
        { label: "Run success rate", value: `${jitter(91, 5)}%`, tone: "good" },
        { label: "Avg steps / run", value: `${jitter(7.4, 1.5, 1)}` },
        { label: "Tokens / run", value: `${jitter(38, 8)}K` },
        { label: "Cost / run", value: `$${jitter(0.42, 0.1, 2)}` },
        { label: "Blocked-tool rate", value: `${jitter(4.5, 2, 1)}%`, tone: "warning" },
        { label: "HITL checkpoint latency", value: `${jitter(3.2, 1, 1)}m` },
        { label: "Autonomy budget used", value: `${jitter(64, 12)}%`, tone: "warning" },
      ];
      break;
    case "data-scientist":
      cards = [
        { label: "Live accuracy", value: `${jitter(88.5, 2, 1)}%`, tone: "good" },
        { label: "Prediction drift", value: `${jitter(0.18, 0.06, 2)}`, tone: "warning" },
        { label: "Serving latency", value: `${jitter(46, 10)}ms` },
        { label: "Request volume", value: `${jitter(12.4, 2, 1)}K/h` },
      ];
      break;
    case "app-engineer":
      cards = [
        { label: "Pod health", value: `${jitter(3, 0)}/3 Ready`, tone: "good" },
        { label: "Replica count", value: `${jitter(3, 0)}` },
        { label: "CPU", value: `${jitter(58, 15)}%`, tone: "warning" },
        { label: "Memory", value: `${jitter(64, 12)}%`, tone: "warning" },
        { label: "Request rate", value: `${jitter(1240, 200)}/s` },
        { label: "Error rate", value: `${jitter(0.6, 0.4, 2)}%`, tone: "good" },
        { label: "Sync status", value: "Synced", tone: "good" },
      ];
      break;
    case "mlops":
      cards = [
        { label: "Pipeline success rate", value: `${jitter(94, 4)}%`, tone: "good" },
        { label: "Avg run duration", value: `${jitter(42, 8)}m` },
        { label: "GPU utilisation", value: `${jitter(71, 12)}%`, tone: "warning" },
        { label: "CPU utilisation", value: `${jitter(48, 12)}%` },
        { label: "Data freshness", value: `${jitter(3, 1)}h` },
        { label: "Drift score", value: `${jitter(0.62, 0.1, 2)}`, tone: "poor" },
      ];
      break;
    case "security":
      cards = [
        { label: "Violation rate", value: `${jitter(2.4, 1.2, 1)}%`, tone: "warning" },
        { label: "Guardrail incidents", value: `${jitter(6, 3)}`, tone: "warning" },
        { label: "Access anomalies", value: `${jitter(2, 2)}`, tone: "poor" },
        { label: "Audit event volume", value: `${jitter(18.6, 3, 1)}K` },
      ];
      break;
    case "data-engineer":
      cards = [
        { label: "Pipeline success rate", value: `${jitter(96, 3)}%`, tone: "good" },
        { label: "Rows processed", value: `${jitter(24.8, 4, 1)}M` },
        { label: "DQ pass rate", value: `${jitter(97.5, 2, 1)}%`, tone: "good" },
        { label: "Dataset freshness", value: `${jitter(2, 1)}h` },
        { label: "Feature-store lag", value: `${jitter(12, 6)}m`, tone: "warning" },
      ];
      break;
    default:
      cards = [];
  }
  return { cards };
}

export async function getHealthSeries(
  personaId: string,
  assetId: string,
  range: TimeRange
): Promise<HealthChartSpec[]> {
  await delay();
  const seed = `${personaId}:${assetId}:${range}`;
  let specs: HealthChartSpec[] = [];

  switch (personaId) {
    case "ai-engineer":
      specs = [
        {
          id: "latency",
          title: "Latency percentiles (ms)",
          kind: "line",
          series: [
            { key: "p50", label: "p50" },
            { key: "p95", label: "p95" },
            { key: "p99", label: "p99" },
          ],
          data: series(seed, range, [
            { key: "p50", base: 420, amp: 50, digits: 0 },
            { key: "p95", base: 980, amp: 120, digits: 0 },
            { key: "p99", base: 1650, amp: 220, digits: 0 },
          ]),
        },
        {
          id: "faithfulness",
          title: "Faithfulness over time",
          kind: "line",
          threshold: 0.9,
          series: [{ key: "value", label: "faithfulness" }],
          data: series(seed, range, [{ key: "value", base: 0.93, amp: 0.04, digits: 3 }]),
        },
        {
          id: "tokencost",
          title: "Token usage & cost/call",
          kind: "line",
          series: [
            { key: "tokens_k", label: "tokens (K)" },
            { key: "cost_call", label: "cost/call ($)" },
          ],
          data: series(seed, range, [
            { key: "tokens_k", base: 520, amp: 90, digits: 0 },
            { key: "cost_call", base: 0.012, amp: 0.004, digits: 3 },
          ]),
        },
      ];
      break;
    case "agentic-engineer":
      specs = [
        {
          id: "success",
          title: "Run success rate (%)",
          kind: "line",
          threshold: 90,
          series: [{ key: "value", label: "success rate" }],
          data: series(seed, range, [{ key: "value", base: 91, amp: 5, digits: 1 }]),
        },
        {
          id: "steps",
          title: "Steps per run",
          kind: "area",
          series: [
            { key: "avg", label: "avg steps" },
            { key: "max", label: "max steps" },
          ],
          data: series(seed, range, [
            { key: "avg", base: 7.4, amp: 1.5, digits: 1 },
            { key: "max", base: 14, amp: 3, digits: 0 },
          ]),
        },
      ];
      break;
    case "data-scientist":
      specs = [
        {
          id: "accuracy",
          title: "Live accuracy over time (%)",
          kind: "line",
          threshold: 85,
          series: [{ key: "value", label: "accuracy" }],
          data: series(seed, range, [{ key: "value", base: 88.5, amp: 2.5, digits: 1 }]),
        },
        {
          id: "volume",
          title: "Request volume (K/h)",
          kind: "area",
          series: [{ key: "value", label: "requests" }],
          data: series(seed, range, [{ key: "value", base: 12.4, amp: 3, digits: 1 }]),
        },
      ];
      break;
    case "app-engineer":
      specs = [
        {
          id: "cpumem",
          title: "CPU & memory utilisation (%)",
          kind: "line",
          series: [
            { key: "cpu", label: "CPU" },
            { key: "mem", label: "memory" },
          ],
          data: series(seed, range, [
            { key: "cpu", base: 58, amp: 18, digits: 0 },
            { key: "mem", base: 64, amp: 14, digits: 0 },
          ]),
        },
        {
          id: "reqerr",
          title: "Request & error rate",
          kind: "line",
          series: [
            { key: "req", label: "requests/s" },
            { key: "err", label: "errors/s" },
          ],
          data: series(seed, range, [
            { key: "req", base: 1240, amp: 220, digits: 0 },
            { key: "err", base: 8, amp: 5, digits: 0 },
          ]),
        },
      ];
      break;
    case "mlops":
      specs = [
        {
          id: "drift",
          title: "Drift-score trend",
          kind: "line",
          threshold: 0.6,
          series: [{ key: "value", label: "drift score" }],
          data: series(seed, range, [{ key: "value", base: 0.55, amp: 0.15, digits: 2 }]),
        },
        {
          id: "util",
          title: "GPU & CPU utilisation (%)",
          kind: "line",
          series: [
            { key: "gpu", label: "GPU" },
            { key: "cpu", label: "CPU" },
          ],
          data: series(seed, range, [
            { key: "gpu", base: 71, amp: 15, digits: 0 },
            { key: "cpu", base: 48, amp: 14, digits: 0 },
          ]),
        },
      ];
      break;
    case "security":
      specs = [
        {
          id: "violations",
          title: "Violation rate over time (%)",
          kind: "line",
          series: [{ key: "value", label: "violation rate" }],
          data: series(seed, range, [{ key: "value", base: 2.4, amp: 1.4, digits: 1 }]),
        },
        {
          id: "audit",
          title: "Audit event volume (K)",
          kind: "area",
          series: [{ key: "value", label: "audit events" }],
          data: series(seed, range, [{ key: "value", base: 18.6, amp: 4, digits: 1 }]),
        },
      ];
      break;
    case "data-engineer":
      specs = [
        {
          id: "dq",
          title: "DQ pass rate over time (%)",
          kind: "line",
          threshold: 95,
          series: [{ key: "value", label: "DQ pass rate" }],
          data: series(seed, range, [{ key: "value", base: 97.5, amp: 2.5, digits: 1 }]),
        },
        {
          id: "rows",
          title: "Rows processed (M)",
          kind: "area",
          series: [{ key: "value", label: "rows" }],
          data: series(seed, range, [{ key: "value", base: 24.8, amp: 5, digits: 1 }]),
        },
      ];
      break;
    default:
      specs = [];
  }
  return specs;
}
