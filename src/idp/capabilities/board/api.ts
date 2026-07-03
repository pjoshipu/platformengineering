import { delay } from "../../api/client";

/**
 * Capability 4.1 — Customizable Dashboard (persona-parameterized mock).
 *
 * ONE persona-aware screen ("My Dashboard"). Each persona has a catalog of
 * available widgets (defaults + a small library) and a default ordered layout.
 * `getWidgetCatalog(persona)` returns ALL widgets (metric + chart) with realistic
 * mock data; `getDefaultLayout(persona)` returns the ordered ids shown by default;
 * `saveLayout(persona, ids)` persists (mock) the chosen layout.
 */

export type MetricTone = "default" | "good" | "warning" | "poor";

export interface Widget {
  id: string;
  title: string;
  kind: "metric" | "line" | "area" | "bar";
  metric?: {
    value: string;
    delta?: string;
    deltaPositive?: boolean;
    tone?: MetricTone;
  };
  series?: { key: string; label?: string }[];
  data?: Record<string, unknown>[];
}

// --- Deterministic-ish series generation ------------------------------------

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
    const t = (h ^= h >>> 16) >>> 0;
    return t / 4294967296;
  };
}

/**
 * Build a small timeseries with a `ts` label + one point per series key.
 * `bases` gives the mid value for each key; values wobble deterministically.
 */
function series(
  seed: string,
  keys: string[],
  bases: number[],
  points = 8,
  decimals = 0
): Record<string, unknown>[] {
  const rnd = seeded(seed);
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < points; i++) {
    const row: Record<string, unknown> = { ts: `T-${points - 1 - i}` };
    keys.forEach((k, ki) => {
      const base = bases[ki] ?? 10;
      const wobble = (rnd() - 0.45) * base * 0.4;
      const v = Math.max(0, base + wobble);
      row[k] = decimals > 0 ? Number(v.toFixed(decimals)) : Math.round(v);
    });
    rows.push(row);
  }
  return rows;
}

// --- Per-persona widget catalogs --------------------------------------------

interface PersonaBoard {
  /** ordered default layout (widget ids) */
  defaults: string[];
  /** all widgets: defaults + extra library widgets */
  widgets: Widget[];
}

const metric = (
  id: string,
  title: string,
  value: string,
  opts: Partial<Widget["metric"]> = {}
): Widget => ({ id, title, kind: "metric", metric: { value, ...opts } });

const CONFIG: Record<string, PersonaBoard> = {
  "ai-engineer": {
    defaults: [
      "llm-apps-health",
      "cost-today",
      "avg-faithfulness",
      "active-canaries",
      "recent-incidents",
      "prompt-activity",
    ],
    widgets: [
      metric("llm-apps-health", "Active LLM apps health", "18 / 19", { delta: "+1", deltaPositive: true, tone: "good" }),
      metric("cost-today", "Today's cost", "$412.80", { delta: "-6%", deltaPositive: true, tone: "default" }),
      metric("avg-faithfulness", "Avg faithfulness", "0.94", { delta: "+0.02", deltaPositive: true, tone: "good" }),
      metric("active-canaries", "Active canaries", "3", { tone: "warning" }),
      metric("recent-incidents", "Recent incidents (7d)", "2", { delta: "-1", deltaPositive: true, tone: "warning" }),
      {
        id: "prompt-activity",
        title: "Prompt activity",
        kind: "area",
        series: [{ key: "prompts", label: "Prompts" }],
        data: series("ai-prompts", ["prompts"], [1400]),
      },
      // library
      metric("token-spend-mtd", "Token spend MTD", "$9.1k", { delta: "+4%", deltaPositive: false, tone: "default" }),
      metric("guardrail-blocks", "Guardrail blocks today", "27", { tone: "warning" }),
      {
        id: "latency-p95",
        title: "Inference p95 latency (ms)",
        kind: "line",
        series: [{ key: "p95", label: "p95" }],
        data: series("ai-latency", ["p95"], [820]),
      },
      {
        id: "cost-trend",
        title: "Cost trend ($/day)",
        kind: "line",
        series: [{ key: "cost", label: "Cost" }],
        data: series("ai-cost", ["cost"], [420], 8, 0),
      },
    ],
  },
  "agentic-engineer": {
    defaults: [
      "agents-health",
      "active-runs",
      "pending-checkpoints",
      "autonomy-budget",
      "cost-today",
    ],
    widgets: [
      metric("agents-health", "Agents health", "11 / 12", { delta: "0", deltaPositive: true, tone: "good" }),
      metric("active-runs", "Active runs", "34", { delta: "+8", deltaPositive: true, tone: "default" }),
      metric("pending-checkpoints", "Pending checkpoints", "5", { tone: "warning" }),
      metric("autonomy-budget", "Autonomy budget used", "62%", { delta: "+9%", deltaPositive: false, tone: "warning" }),
      metric("cost-today", "Today's cost", "$278.40", { delta: "-3%", deltaPositive: true }),
      // library
      metric("failed-runs", "Failed runs today", "3", { tone: "poor" }),
      metric("avg-steps", "Avg steps / run", "14", { tone: "default" }),
      {
        id: "runs-trend",
        title: "Runs over time",
        kind: "area",
        series: [{ key: "runs", label: "Runs" }],
        data: series("ag-runs", ["runs"], [30]),
      },
      {
        id: "outcome-mix",
        title: "Run outcomes",
        kind: "bar",
        series: [
          { key: "success", label: "Success" },
          { key: "failed", label: "Failed" },
          { key: "escalated", label: "Escalated" },
        ],
        data: series("ag-outcomes", ["success", "failed", "escalated"], [26, 3, 5]),
      },
    ],
  },
  "data-scientist": {
    defaults: [
      "active-training",
      "experiments-week",
      "models-pending",
      "recent-results",
    ],
    widgets: [
      metric("active-training", "Active training jobs", "4", { delta: "+2", deltaPositive: true, tone: "default" }),
      metric("experiments-week", "Experiments this week", "23", { delta: "+7", deltaPositive: true, tone: "good" }),
      metric("models-pending", "Models pending approval", "3", { tone: "warning" }),
      {
        id: "recent-results",
        title: "Recent eval accuracy",
        kind: "line",
        series: [{ key: "accuracy", label: "Accuracy" }],
        data: series("ds-acc", ["accuracy"], [0.88], 8, 3),
      },
      // library
      metric("gpu-hours", "GPU hours (7d)", "312", { delta: "+18%", deltaPositive: false, tone: "default" }),
      metric("best-metric", "Best F1 (current sweep)", "0.912", { tone: "good" }),
      {
        id: "loss-trend",
        title: "Training loss",
        kind: "area",
        series: [{ key: "loss", label: "Loss" }],
        data: series("ds-loss", ["loss"], [0.4], 8, 3),
      },
    ],
  },
  "app-engineer": {
    defaults: [
      "services-healthy",
      "gitops-errors",
      "active-deployments",
      "infra-drift",
    ],
    widgets: [
      metric("services-healthy", "Services healthy", "42 / 45", { delta: "-1", deltaPositive: false, tone: "warning" }),
      metric("gitops-errors", "GitOps sync errors", "2", { tone: "poor" }),
      metric("active-deployments", "Active deployments", "6", { delta: "+3", deltaPositive: true, tone: "default" }),
      metric("infra-drift", "Infra drift detected", "4", { tone: "warning" }),
      // library
      metric("error-rate", "Error rate (5xx)", "0.6%", { delta: "-0.2%", deltaPositive: true, tone: "good" }),
      metric("rollbacks-7d", "Rollbacks (7d)", "1", { tone: "warning" }),
      {
        id: "deploys-trend",
        title: "Deployments / day",
        kind: "bar",
        series: [{ key: "deploys", label: "Deploys" }],
        data: series("app-deploys", ["deploys"], [6]),
      },
      {
        id: "latency-trend",
        title: "Request p95 latency (ms)",
        kind: "line",
        series: [{ key: "p95", label: "p95" }],
        data: series("app-latency", ["p95"], [240]),
      },
    ],
  },
  mlops: {
    defaults: [
      "pipeline-health",
      "drift-alerts",
      "gpu-utilisation",
      "retraining-today",
    ],
    widgets: [
      metric("pipeline-health", "Pipeline health", "9 / 10", { delta: "0", deltaPositive: true, tone: "good" }),
      metric("drift-alerts", "Active drift alerts", "3", { delta: "+1", deltaPositive: false, tone: "warning" }),
      metric("gpu-utilisation", "GPU utilisation", "78%", { delta: "+5%", deltaPositive: true, tone: "default" }),
      metric("retraining-today", "Retraining jobs today", "2", { tone: "default" }),
      // library
      metric("serving-qps", "Serving QPS", "1.2k", { delta: "+3%", deltaPositive: true }),
      metric("stale-models", "Stale models", "4", { tone: "warning" }),
      {
        id: "util-trend",
        title: "GPU utilisation (%)",
        kind: "area",
        series: [{ key: "util", label: "Utilisation" }],
        data: series("mlops-util", ["util"], [76]),
      },
      {
        id: "drift-trend",
        title: "Drift score",
        kind: "line",
        series: [{ key: "drift", label: "Drift" }],
        data: series("mlops-drift", ["drift"], [0.22], 8, 3),
      },
    ],
  },
  security: {
    defaults: [
      "policy-violations",
      "compliance-namespace",
      "guardrail-incidents",
      "access-anomalies",
    ],
    widgets: [
      metric("policy-violations", "Policy violations today", "7", { delta: "+2", deltaPositive: false, tone: "poor" }),
      {
        id: "compliance-namespace",
        title: "Compliance by namespace (%)",
        kind: "bar",
        series: [{ key: "compliant", label: "Compliant" }],
        data: series("sec-compliance", ["compliant"], [88], 8, 0),
      },
      metric("guardrail-incidents", "Guardrail incidents", "5", { tone: "warning" }),
      metric("access-anomalies", "Access anomalies", "3", { delta: "-1", deltaPositive: true, tone: "warning" }),
      // library
      metric("open-cves", "Open critical CVEs", "12", { delta: "-4", deltaPositive: true, tone: "poor" }),
      metric("secrets-flagged", "Secrets flagged", "2", { tone: "poor" }),
      {
        id: "violations-trend",
        title: "Violations / day",
        kind: "line",
        series: [{ key: "violations", label: "Violations" }],
        data: series("sec-violations", ["violations"], [7]),
      },
    ],
  },
  "data-engineer": {
    defaults: [
      "pipelines-running",
      "failed-runs",
      "dq-alerts",
      "datasets-published",
    ],
    widgets: [
      metric("pipelines-running", "Pipelines running", "17", { delta: "+2", deltaPositive: true, tone: "default" }),
      metric("failed-runs", "Failed runs today", "3", { delta: "+1", deltaPositive: false, tone: "poor" }),
      metric("dq-alerts", "Data quality alerts", "5", { tone: "warning" }),
      metric("datasets-published", "Datasets published (7d)", "8", { delta: "+3", deltaPositive: true, tone: "good" }),
      // library
      metric("freshness-sla", "Freshness SLA met", "96%", { delta: "-1%", deltaPositive: false, tone: "good" }),
      metric("rows-processed", "Rows processed today", "42M", { tone: "default" }),
      {
        id: "runs-trend",
        title: "Pipeline runs / day",
        kind: "bar",
        series: [
          { key: "success", label: "Success" },
          { key: "failed", label: "Failed" },
        ],
        data: series("de-runs", ["success", "failed"], [24, 3]),
      },
      {
        id: "dq-trend",
        title: "DQ alerts trend",
        kind: "area",
        series: [{ key: "alerts", label: "Alerts" }],
        data: series("de-dq", ["alerts"], [5]),
      },
    ],
  },
};

const empty: PersonaBoard = { defaults: [], widgets: [] };

/** All available widgets (defaults + library) for the persona. */
export async function getWidgetCatalog(personaId: string): Promise<Widget[]> {
  await delay();
  return (CONFIG[personaId] ?? empty).widgets;
}

/** Ordered widget ids shown by default for the persona. */
export async function getDefaultLayout(personaId: string): Promise<string[]> {
  await delay();
  return (CONFIG[personaId] ?? empty).defaults;
}

/** Persist (mock) the chosen layout. */
export async function saveLayout(
  personaId: string,
  ids: string[]
): Promise<{ status: string }> {
  await delay();
  return { status: `Saved ${ids.length} widget(s) for ${personaId || "unknown"}` };
}
