import { delay } from "../../api/client";

/**
 * Capability 4.2 — Portal Usage Analytics (persona-parameterized mock).
 *
 * ONE persona-aware screen with two modes:
 *  - Individual ("my activity") — everyone. `getMyActivity(persona, range)`
 *    returns the persona's own-usage cards + 1–2 trend charts.
 *  - Admin ("org rollups") — only the `security` persona (treated as admin).
 *    `getOrgAnalytics(range)` returns org-wide adoption/usage rollups.
 *
 * Uses the same seeded generators pattern as Infra KPIs so mock values are
 * stable within a render.
 */

export type MetricTone = "default" | "good" | "warning" | "poor";

export interface ActivityCard {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  tone?: MetricTone;
}

export type ChartKind = "line" | "area";

export interface ActivityTrend {
  id: string;
  title: string;
  kind: ChartKind;
  series: { key: string; label?: string }[];
  data: Record<string, unknown>[];
}

export interface MyActivity {
  cards: ActivityCard[];
  trend: ActivityTrend[];
}

export interface OrgCard {
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
}

export interface TeamRow {
  team: string;
  active_users: number;
  deploys: number;
  adoption: number;
}

export interface Contributor {
  name: string;
  persona: string;
  contributions: number;
}

export interface OrgAnalytics {
  cards: OrgCard[];
  adoption: { name: string; value: number }[];
  by_team: TeamRow[];
  top_contributors: Contributor[];
  top_terms: string[];
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
      row[k.key] = Number(val.toFixed(k.digits ?? 0));
    }
    return row;
  });
}

// --- Individual ("my activity") ---------------------------------------------

export async function getMyActivity(
  personaId: string,
  range: TimeRange
): Promise<MyActivity> {
  await delay();
  const seed = `${personaId}:${range}:me`;
  const r = seeded(seed);
  const jitter = (base: number, spread: number, digits = 0) =>
    Number((base + (r() - 0.5) * 2 * spread).toFixed(digits));

  let cards: ActivityCard[] = [];
  let trend: ActivityTrend[] = [];

  switch (personaId) {
    case "ai-engineer":
      cards = [
        { label: "My app deployments", value: `${jitter(9, 3)}`, tone: "good", delta: `+${jitter(2, 1)}`, deltaPositive: true },
        { label: "My prompt changes", value: `${jitter(23, 6)}` },
        { label: "Cost attributed to me", value: `$${jitter(184, 40)}`, delta: `+${jitter(6, 3, 1)}%`, deltaPositive: false },
        { label: "My guardrail incidents", value: `${jitter(2, 2)}`, tone: "warning" },
      ];
      trend = [
        {
          id: "deploys",
          title: "My app deployments over time",
          kind: "line",
          series: [{ key: "value", label: "deployments" }],
          data: series(seed, range, [{ key: "value", base: 3, amp: 2 }]),
        },
        {
          id: "prompts",
          title: "My prompt changes",
          kind: "area",
          series: [{ key: "value", label: "prompt changes" }],
          data: series(seed, range, [{ key: "value", base: 6, amp: 3 }]),
        },
      ];
      break;
    case "agentic-engineer":
      cards = [
        { label: "My agents deployed", value: `${jitter(5, 2)}`, tone: "good" },
        { label: "My runs", value: `${jitter(142, 30)}`, delta: `+${jitter(9, 4, 1)}%`, deltaPositive: true },
        { label: "Checkpoints I approved", value: `${jitter(37, 10)}` },
        { label: "Tools I enabled", value: `${jitter(12, 4)}` },
      ];
      trend = [
        {
          id: "runs",
          title: "My agent runs over time",
          kind: "line",
          series: [{ key: "value", label: "runs" }],
          data: series(seed, range, [{ key: "value", base: 20, amp: 8 }]),
        },
        {
          id: "checkpoints",
          title: "Checkpoints I approved",
          kind: "area",
          series: [{ key: "value", label: "approvals" }],
          data: series(seed, range, [{ key: "value", base: 5, amp: 3 }]),
        },
      ];
      break;
    case "data-scientist":
      cards = [
        { label: "My training jobs", value: `${jitter(14, 4)}` },
        { label: "My experiment runs", value: `${jitter(58, 14)}`, tone: "good", delta: `+${jitter(11, 5, 1)}%`, deltaPositive: true },
        { label: "Models I promoted", value: `${jitter(3, 2)}` },
        { label: "My dataset requests", value: `${jitter(6, 3)}`, tone: "warning" },
      ];
      trend = [
        {
          id: "experiments",
          title: "My experiment runs over time",
          kind: "line",
          series: [{ key: "value", label: "experiments" }],
          data: series(seed, range, [{ key: "value", base: 9, amp: 4 }]),
        },
        {
          id: "training",
          title: "My training jobs",
          kind: "area",
          series: [{ key: "value", label: "training jobs" }],
          data: series(seed, range, [{ key: "value", base: 2, amp: 2 }]),
        },
      ];
      break;
    case "app-engineer":
      cards = [
        { label: "My deployments", value: `${jitter(21, 6)}`, tone: "good", delta: `+${jitter(4, 2)}`, deltaPositive: true },
        { label: "My resource provisions", value: `${jitter(8, 3)}` },
        { label: "My GitOps syncs", value: `${jitter(46, 12)}` },
        { label: "My rollbacks", value: `${jitter(2, 2)}`, tone: "warning" },
      ];
      trend = [
        {
          id: "deploys",
          title: "My deployments over time",
          kind: "line",
          series: [{ key: "value", label: "deployments" }],
          data: series(seed, range, [{ key: "value", base: 5, amp: 3 }]),
        },
        {
          id: "syncs",
          title: "My GitOps syncs",
          kind: "area",
          series: [{ key: "value", label: "syncs" }],
          data: series(seed, range, [{ key: "value", base: 10, amp: 4 }]),
        },
      ];
      break;
    case "mlops":
      cards = [
        { label: "My pipeline runs", value: `${jitter(64, 16)}`, tone: "good" },
        { label: "Drift alerts I resolved", value: `${jitter(11, 4)}`, delta: `+${jitter(3, 2)}`, deltaPositive: true },
        { label: "Retraining rules I triggered", value: `${jitter(7, 3)}` },
        { label: "Open drift alerts", value: `${jitter(3, 2)}`, tone: "warning" },
      ];
      trend = [
        {
          id: "pipelines",
          title: "My pipeline runs over time",
          kind: "line",
          series: [{ key: "value", label: "pipeline runs" }],
          data: series(seed, range, [{ key: "value", base: 12, amp: 5 }]),
        },
        {
          id: "drift",
          title: "Drift alerts I resolved",
          kind: "area",
          series: [{ key: "value", label: "resolved" }],
          data: series(seed, range, [{ key: "value", base: 2, amp: 2 }]),
        },
      ];
      break;
    case "security":
      cards = [
        { label: "Policies I deployed", value: `${jitter(9, 3)}`, tone: "good" },
        { label: "Violations I resolved", value: `${jitter(28, 8)}`, delta: `+${jitter(5, 3)}`, deltaPositive: true },
        { label: "My audit exports", value: `${jitter(14, 5)}` },
        { label: "Scans I triggered", value: `${jitter(41, 10)}` },
      ];
      trend = [
        {
          id: "violations",
          title: "Violations I resolved over time",
          kind: "line",
          series: [{ key: "value", label: "resolved" }],
          data: series(seed, range, [{ key: "value", base: 5, amp: 3 }]),
        },
        {
          id: "scans",
          title: "Scans I triggered",
          kind: "area",
          series: [{ key: "value", label: "scans" }],
          data: series(seed, range, [{ key: "value", base: 8, amp: 4 }]),
        },
      ];
      break;
    case "data-engineer":
      cards = [
        { label: "My pipeline runs", value: `${jitter(72, 18)}`, tone: "good", delta: `+${jitter(6, 3, 1)}%`, deltaPositive: true },
        { label: "Datasets I published", value: `${jitter(5, 2)}` },
        { label: "DQ alerts I resolved", value: `${jitter(17, 6)}` },
        { label: "My feature refreshes", value: `${jitter(23, 7)}`, tone: "warning" },
      ];
      trend = [
        {
          id: "pipelines",
          title: "My pipeline runs over time",
          kind: "line",
          series: [{ key: "value", label: "pipeline runs" }],
          data: series(seed, range, [{ key: "value", base: 13, amp: 5 }]),
        },
        {
          id: "dq",
          title: "DQ alerts I resolved",
          kind: "area",
          series: [{ key: "value", label: "resolved" }],
          data: series(seed, range, [{ key: "value", base: 3, amp: 2 }]),
        },
      ];
      break;
    default:
      cards = [
        { label: "My portal actions", value: `${jitter(48, 12)}` },
        { label: "My deployments", value: `${jitter(9, 3)}` },
        { label: "My catalog searches", value: `${jitter(31, 8)}` },
        { label: "My docs viewed", value: `${jitter(22, 6)}` },
      ];
      trend = [
        {
          id: "actions",
          title: "My portal actions over time",
          kind: "line",
          series: [{ key: "value", label: "actions" }],
          data: series(seed, range, [{ key: "value", base: 8, amp: 4 }]),
        },
      ];
  }

  return { cards, trend };
}

// --- Admin ("org rollups") --------------------------------------------------

const PERSONA_LABELS: Record<string, string> = {
  "ai-engineer": "AI Engineer",
  "agentic-engineer": "Agentic Engineer",
  "data-scientist": "Data Scientist",
  "app-engineer": "App Engineer",
  mlops: "MLOps",
  security: "Security",
  "data-engineer": "Data Engineer",
};

const TEAMS = ["Payments", "Checkout", "Platform Core", "Data Foundation", "ML Enablement", "Growth"];

const CAPABILITIES = [
  "Software Catalog",
  "Self-service deploy",
  "Golden templates",
  "Cost insights",
  "Infra KPIs",
  "Feature flags",
  "Security policies",
];

const CONTRIBUTOR_NAMES = [
  "Priya Nair",
  "Marcus Reed",
  "Elena Vogt",
  "Tomás Alvarez",
  "Wei Chen",
  "Aisha Rahman",
  "Jonas Berg",
  "Rina Kapoor",
];

const SEARCH_TERMS = [
  "postgres",
  "helm chart",
  "vault secret",
  "rollback",
  "gpu quota",
  "feature flag",
  "opa policy",
  "kafka topic",
  "prompt template",
  "sso login",
];

export async function getOrgAnalytics(range: TimeRange): Promise<OrgAnalytics> {
  await delay();
  const seed = `org:${range}`;
  const r = seeded(seed);
  const jitter = (base: number, spread: number, digits = 0) =>
    Number((base + (r() - 0.5) * 2 * spread).toFixed(digits));

  const totalActive = jitter(342, 40);

  const cards: OrgCard[] = [
    { label: "Active users", value: `${totalActive}`, delta: `+${jitter(18, 8)}`, deltaPositive: true },
    { label: "Feature adoption", value: `${jitter(71, 8)}%`, delta: `+${jitter(4, 2, 1)}%`, deltaPositive: true },
    { label: "Deploy frequency", value: `${jitter(214, 30)}/wk`, delta: `+${jitter(9, 4, 1)}%`, deltaPositive: true },
    { label: "Doc coverage score", value: `${jitter(83, 6)}/100`, delta: `+${jitter(3, 2)} pts`, deltaPositive: true },
    { label: "Forum participation", value: `${jitter(58, 10)}%`, delta: `-${jitter(2, 1, 1)}%`, deltaPositive: false },
  ];

  // Active users per persona (feeds the "active users per persona" idea) +
  // feature adoption per capability — both plotted as horizontal bars.
  const adoption: { name: string; value: number }[] = CAPABILITIES.map((name, i) => ({
    name,
    value: jitter(80 - i * 6, 6),
  }));

  const by_team: TeamRow[] = TEAMS.map((team) => ({
    team,
    active_users: jitter(58, 20),
    deploys: jitter(140, 60),
    adoption: jitter(72, 14),
  }));

  const top_contributors: Contributor[] = CONTRIBUTOR_NAMES.slice(0, 6)
    .map((name, i) => {
      const personas = Object.keys(PERSONA_LABELS);
      const persona = personas[(i + Math.floor(r() * personas.length)) % personas.length];
      return {
        name,
        persona: PERSONA_LABELS[persona] ?? persona,
        contributions: jitter(120 - i * 12, 15),
      };
    })
    .sort((a, b) => b.contributions - a.contributions);

  const top_terms = SEARCH_TERMS.slice(0, 8);

  return { cards, adoption, by_team, top_contributors, top_terms };
}
