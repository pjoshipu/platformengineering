import { delay } from "../../api/client";

/**
 * Capability 3.4 — Infrastructure KPIs (persona-parameterized mock).
 *
 * ONE persona-aware screen. `getInfraKpis(persona, range)` returns the persona's
 * resource-efficiency / reliability KPI cards (value + optional delta + tone);
 * `getInfraTrends(persona, range)` returns 2–3 chart specs with generated
 * timeseries. Mirrors the Health capability: persona-keyed switch + a seeded
 * `series()` builder so charts are stable within a render.
 */

export type MetricTone = "default" | "good" | "warning" | "poor";

export interface InfraCard {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  tone?: MetricTone;
}

export type ChartKind = "line" | "area" | "stacked";

export interface InfraTrend {
  id: string;
  title: string;
  kind: ChartKind;
  series: { key: string; label?: string }[];
  data: Record<string, unknown>[];
}

export type TimeRange = "24h" | "7d" | "30d";

// --- Deterministic-ish value generation -------------------------------------

/** Stable pseudo-random in [0,1) from a string seed (so values don't flicker). */
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

/** X-axis labels for a range: hour labels for 24h, D-6..D-0 style otherwise. */
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

export async function getInfraKpis(
  personaId: string,
  range: TimeRange
): Promise<{ cards: InfraCard[] }> {
  await delay();
  const r = seeded(`${personaId}:${range}:kpis`);
  const jitter = (base: number, spread: number, digits = 0) =>
    Number((base + (r() - 0.5) * 2 * spread).toFixed(digits));
  // Small signed delta helper for period-over-period movement.
  const delta = (spread: number, digits = 1) => {
    const v = (r() - 0.5) * 2 * spread;
    return { text: `${v >= 0 ? "+" : ""}${v.toFixed(digits)}`, up: v >= 0 };
  };

  let cards: InfraCard[] = [];
  switch (personaId) {
    case "ai-engineer": {
      const up = delta(1.2);
      cards = [
        { label: "Endpoint uptime", value: `${jitter(99.94, 0.05, 2)}%`, tone: "good", delta: `${up.text}%`, deltaPositive: true },
        { label: "Serving latency (p95)", value: `${jitter(980, 120)}ms`, tone: "warning", delta: `+${jitter(4.2, 2, 1)}%`, deltaPositive: false },
        { label: "Token throughput", value: `${jitter(altBase(r, 4.2, 6.8), 0.6, 1)}M tok/h` },
        { label: "Cost / 1k calls", value: `$${jitter(0.42, 0.08, 2)}`, delta: `-${jitter(3.1, 1.5, 1)}%`, deltaPositive: true },
        { label: "Guardrail trigger rate", value: `${jitter(2.1, 1, 1)}%`, tone: "warning" },
      ];
      break;
    }
    case "agentic-engineer": {
      cards = [
        { label: "Active agents", value: `${jitter(12, 3)}` },
        { label: "Active runs", value: `${jitter(34, 10)}`, tone: "good" },
        { label: "Pending checkpoints", value: `${jitter(5, 3)}`, tone: "warning" },
        { label: "Autonomy budget used", value: `${jitter(64, 12)}%`, tone: "warning", delta: `+${jitter(6, 3)}%`, deltaPositive: false },
        { label: "Token spend / day", value: `$${jitter(altBase(r, 180, 340), 30)}`, delta: `+${jitter(8, 4, 1)}%`, deltaPositive: false },
      ];
      break;
    }
    case "data-scientist": {
      cards = [
        { label: "Training-queue depth", value: `${jitter(7, 4)}`, tone: "warning" },
        { label: "Avg wait time", value: `${jitter(18, 8)}m`, tone: "warning" },
        { label: "GPU-hours this month", value: `${jitter(1240, 180)}`, delta: `${(r() * 100).toFixed(0)}% of quota` },
        { label: "Serving request volume", value: `${jitter(12.4, 2, 1)}K/h`, tone: "good", delta: `+${jitter(5.2, 2, 1)}%`, deltaPositive: true },
      ];
      break;
    }
    case "app-engineer": {
      const healthy = jitter(11, 1);
      cards = [
        { label: "Services healthy", value: `${healthy}/${healthy + jitter(1, 1)} Ready`, tone: "good" },
        { label: "Sync error rate", value: `${jitter(1.2, 0.8, 1)}%`, tone: "warning" },
        { label: "Infra drift count", value: `${jitter(3, 2)}`, tone: "warning" },
        { label: "Avg deploy time", value: `${jitter(6.4, 1.5, 1)}m`, delta: `-${jitter(4, 2, 1)}%`, deltaPositive: true },
        { label: "Rollback rate", value: `${jitter(2.8, 1.5, 1)}%`, tone: "poor" },
      ];
      break;
    }
    case "mlops": {
      cards = [
        { label: "GPU utilisation", value: `${jitter(71, 12)}%`, tone: "warning" },
        { label: "CPU utilisation", value: `${jitter(48, 12)}%` },
        { label: "Pipeline success rate", value: `${jitter(94, 4)}%`, tone: "good", delta: `+${jitter(1.5, 1, 1)}%`, deltaPositive: true },
        { label: "Avg training duration", value: `${jitter(42, 8)}m`, delta: `+${jitter(3, 2, 1)}%`, deltaPositive: false },
        { label: "Drift-alert frequency", value: `${jitter(4, 2)}/day`, tone: "poor" },
        { label: "Time-to-retrain", value: `${jitter(3.2, 1, 1)}h` },
      ];
      break;
    }
    case "security": {
      cards = [
        { label: "Compliance score", value: `${jitter(92, 4)}/100`, tone: "good", delta: `+${jitter(2, 1)} pts`, deltaPositive: true },
        { label: "Violation rate", value: `${jitter(2.4, 1.2, 1)}%`, tone: "warning", delta: `-${jitter(0.6, 0.4, 1)}%`, deltaPositive: true },
        { label: "MTTR", value: `${jitter(4.2, 1.5, 1)}h`, delta: `-${jitter(8, 4, 1)}%`, deltaPositive: true },
        { label: "Audit event volume", value: `${jitter(18.6, 3, 1)}K` },
        { label: "Access-anomaly rate", value: `${jitter(0.9, 0.6, 2)}%`, tone: "poor" },
      ];
      break;
    }
    case "data-engineer": {
      cards = [
        { label: "Pipeline success rate", value: `${jitter(96, 3)}%`, tone: "good", delta: `+${jitter(1.2, 0.8, 1)}%`, deltaPositive: true },
        { label: "Avg duration", value: `${jitter(28, 8)}m` },
        { label: "DQ pass rate", value: `${jitter(97.5, 2, 1)}%`, tone: "good" },
        { label: "Dataset freshness lag", value: `${jitter(2, 1)}h`, tone: "warning" },
        { label: "Feature-store update delay", value: `${jitter(12, 6)}m`, tone: "warning" },
      ];
      break;
    }
    default:
      cards = [];
  }
  return { cards };
}

/** Pick one of two bases via the seeded rng so mock magnitudes vary a bit. */
function altBase(r: () => number, a: number, b: number): number {
  return r() < 0.5 ? a : b;
}

export async function getInfraTrends(
  personaId: string,
  range: TimeRange
): Promise<InfraTrend[]> {
  await delay();
  const seed = `${personaId}:${range}`;
  let trends: InfraTrend[] = [];

  switch (personaId) {
    case "ai-engineer":
      trends = [
        {
          id: "latency",
          title: "Serving latency trend (ms)",
          kind: "line",
          series: [
            { key: "p50", label: "p50" },
            { key: "p95", label: "p95" },
          ],
          data: series(seed, range, [
            { key: "p50", base: 420, amp: 50, digits: 0 },
            { key: "p95", base: 980, amp: 120, digits: 0 },
          ]),
        },
        {
          id: "throughput",
          title: "Token throughput (K tok/min)",
          kind: "area",
          series: [{ key: "value", label: "throughput" }],
          data: series(seed, range, [{ key: "value", base: 72, amp: 14, digits: 0 }]),
        },
        {
          id: "cost",
          title: "Cost / 1k calls ($)",
          kind: "line",
          series: [{ key: "value", label: "cost/1k" }],
          data: series(seed, range, [{ key: "value", base: 0.42, amp: 0.08, digits: 3 }]),
        },
      ];
      break;
    case "agentic-engineer":
      trends = [
        {
          id: "runs",
          title: "Active runs & pending checkpoints",
          kind: "stacked",
          series: [
            { key: "runs", label: "active runs" },
            { key: "checkpoints", label: "pending checkpoints" },
          ],
          data: series(seed, range, [
            { key: "runs", base: 34, amp: 10, digits: 0 },
            { key: "checkpoints", base: 5, amp: 3, digits: 0 },
          ]),
        },
        {
          id: "budget",
          title: "Autonomy budget used (%)",
          kind: "area",
          series: [{ key: "value", label: "budget used" }],
          data: series(seed, range, [{ key: "value", base: 64, amp: 12, digits: 0 }]),
        },
        {
          id: "tokens",
          title: "Token spend / day ($)",
          kind: "line",
          series: [{ key: "value", label: "token spend" }],
          data: series(seed, range, [{ key: "value", base: 260, amp: 50, digits: 0 }]),
        },
      ];
      break;
    case "data-scientist":
      trends = [
        {
          id: "queue",
          title: "Training-queue depth",
          kind: "area",
          series: [{ key: "value", label: "queue depth" }],
          data: series(seed, range, [{ key: "value", base: 7, amp: 4, digits: 0 }]),
        },
        {
          id: "gpu",
          title: "GPU-hours consumed",
          kind: "line",
          series: [{ key: "value", label: "GPU-hours" }],
          data: series(seed, range, [{ key: "value", base: 48, amp: 14, digits: 0 }]),
        },
        {
          id: "serving",
          title: "Serving request volume (K/h)",
          kind: "line",
          series: [{ key: "value", label: "requests" }],
          data: series(seed, range, [{ key: "value", base: 12.4, amp: 3, digits: 1 }]),
        },
      ];
      break;
    case "app-engineer":
      trends = [
        {
          id: "sync",
          title: "Sync error rate & rollback rate (%)",
          kind: "line",
          series: [
            { key: "sync", label: "sync errors" },
            { key: "rollback", label: "rollbacks" },
          ],
          data: series(seed, range, [
            { key: "sync", base: 1.2, amp: 0.8, digits: 1 },
            { key: "rollback", base: 2.8, amp: 1.4, digits: 1 },
          ]),
        },
        {
          id: "deploy",
          title: "Avg deploy time (min)",
          kind: "area",
          series: [{ key: "value", label: "deploy time" }],
          data: series(seed, range, [{ key: "value", base: 6.4, amp: 1.5, digits: 1 }]),
        },
        {
          id: "drift",
          title: "Infra drift count",
          kind: "line",
          series: [{ key: "value", label: "drift" }],
          data: series(seed, range, [{ key: "value", base: 3, amp: 2, digits: 0 }]),
        },
      ];
      break;
    case "mlops":
      trends = [
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
        {
          id: "success",
          title: "Pipeline success rate (%)",
          kind: "line",
          series: [{ key: "value", label: "success rate" }],
          data: series(seed, range, [{ key: "value", base: 94, amp: 4, digits: 1 }]),
        },
        {
          id: "duration",
          title: "Avg training duration (min)",
          kind: "area",
          series: [{ key: "value", label: "duration" }],
          data: series(seed, range, [{ key: "value", base: 42, amp: 8, digits: 0 }]),
        },
      ];
      break;
    case "security":
      trends = [
        {
          id: "violation",
          title: "Violation-rate trend (%)",
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
        {
          id: "anomaly",
          title: "Access-anomaly rate (%)",
          kind: "line",
          series: [{ key: "value", label: "anomalies" }],
          data: series(seed, range, [{ key: "value", base: 0.9, amp: 0.6, digits: 2 }]),
        },
      ];
      break;
    case "data-engineer":
      trends = [
        {
          id: "success",
          title: "Pipeline success rate (%)",
          kind: "line",
          series: [{ key: "value", label: "success rate" }],
          data: series(seed, range, [{ key: "value", base: 96, amp: 3, digits: 1 }]),
        },
        {
          id: "dq",
          title: "DQ pass rate (%)",
          kind: "area",
          series: [{ key: "value", label: "DQ pass rate" }],
          data: series(seed, range, [{ key: "value", base: 97.5, amp: 2, digits: 1 }]),
        },
        {
          id: "freshness",
          title: "Dataset freshness & feature-store lag",
          kind: "line",
          series: [
            { key: "freshness_h", label: "freshness (h)" },
            { key: "fs_lag_m", label: "FS lag (m)" },
          ],
          data: series(seed, range, [
            { key: "freshness_h", base: 2, amp: 1, digits: 1 },
            { key: "fs_lag_m", base: 12, amp: 6, digits: 0 },
          ]),
        },
      ];
      break;
    default:
      trends = [];
  }
  return trends;
}
