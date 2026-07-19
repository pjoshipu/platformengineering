/**
 * Persona derivation — the heart of the identity-driven experience.
 *
 * Given an employee profile, infer which of the seven IDP personas the platform
 * should load. This is what replaces the manual persona picker: the user never
 * chooses a role; the role is read from *who they are*. Because it's a pure
 * function of the profile, editing the profile (e.g. changing job title) makes
 * the workspace re-derive live.
 *
 * Rules are keyword-based and field-weighted (job title dominates), so the
 * mapping is explainable — every result carries a human-readable `reason` and
 * the concrete `signals` that produced it.
 */

import { EMPLOYEES, type EmployeeProfile } from "./directory";

export interface PersonaMatch {
  /** derived persona id, e.g. "ai-engineer" */
  personaId: string;
  /** display label for the derived persona */
  label: string;
  /** 0..1 — how strong the signal was */
  confidence: number;
  /** plain-language explanation of why this persona was chosen */
  reason: string;
  /** the concrete profile terms that matched */
  signals: string[];
}

/** Mirrors the persona labels in personas/registry.tsx (kept local to avoid an
 *  import cycle: the registry imports screens, which import useAuth → resolver). */
const PERSONA_LABELS: Record<string, string> = {
  "ai-engineer": "AI Engineer",
  "agentic-engineer": "Agentic Engineer",
  "data-scientist": "Data Scientist",
  "app-engineer": "Platform Engineer",
  mlops: "MLOps Engineer",
  security: "Security Engineer",
  "data-engineer": "Data Engineer",
  admin: "Administrator",
};

interface Rule {
  persona: string;
  /** lowercase keywords that signal this persona */
  keywords: string[];
}

/**
 * Order matters only for deterministic tie-breaks (earlier wins an exact tie).
 * More specific personas are listed before the broad "Platform Engineer".
 */
const RULES: Rule[] = [
  { persona: "admin", keywords: ["administrator", "admin", "platform admin", "idp admin", "head of platform", "platform lead", "platform manager"] },
  { persona: "security", keywords: ["security", "compliance", "grc", "opa", "rego", "gatekeeper", "policy", "audit", "siem", "vulnerability", "threat", "secrets", "cve"] },
  { persona: "agentic-engineer", keywords: ["agentic", "autonomous", "claude agent sdk", "langgraph", "mcp", "tool orchestration", "autonomy", "agent runtime", "run trace"] },
  { persona: "data-engineer", keywords: ["data engineer", "data platform", "etl", "elt", "dbt", "spark", "sql", "bigquery", "warehouse", "lineage", "dataset", "ingestion"] },
  { persona: "mlops", keywords: ["mlops", "ml ops", "ml platform", "kubeflow", "model serving", "drift", "retraining", "serving endpoint", "ml pipeline"] },
  { persona: "data-scientist", keywords: ["data scientist", "data science", "researcher", "research", "pytorch", "scikit", "scikit-learn", "tensorflow", "experiment", "experimentation", "feature store", "statistics", "notebook"] },
  { persona: "ai-engineer", keywords: ["ai engineer", "applied ai", "llm", "genai", "gen ai", "rag", "prompt", "langchain", "vllm", "embedding", "model gateway", "faithfulness", "guardrail"] },
  { persona: "app-engineer", keywords: ["platform engineer", "sre", "devops", "infrastructure", "kubernetes", "k8s", "terraform", "argocd", "gitops", "golden path", "prometheus", "helm"] },
];

/** Field → weight. Title is the strongest signal, then org placement, then tech. */
const FIELD_WEIGHTS = { title: 5, department: 3, team: 3, systems: 2, skills: 2, bio: 1 } as const;

interface Hit {
  keyword: string;
  field: keyof typeof FIELD_WEIGHTS;
  weight: number;
}

const fieldText = (profile: EmployeeProfile, field: keyof typeof FIELD_WEIGHTS): string => {
  switch (field) {
    case "skills":
      return profile.skills.join(" ");
    case "systems":
      return profile.systems.join(" ");
    default:
      return (profile[field] as string) ?? "";
  }
};

/** Fallback when a profile carries no recognizable signal at all. */
const FALLBACK: PersonaMatch = {
  personaId: "app-engineer",
  label: PERSONA_LABELS["app-engineer"],
  confidence: 0,
  reason: "No strong role signal in this profile — defaulting to the Platform Engineer workspace.",
  signals: [],
};

export function resolvePersona(profile: EmployeeProfile): PersonaMatch {
  const fields = Object.keys(FIELD_WEIGHTS) as (keyof typeof FIELD_WEIGHTS)[];

  let best: { rule: Rule; score: number; hits: Hit[] } | null = null;

  for (const rule of RULES) {
    let score = 0;
    const hits: Hit[] = [];
    for (const field of fields) {
      const text = fieldText(profile, field).toLowerCase();
      if (!text) continue;
      for (const kw of rule.keywords) {
        if (text.includes(kw)) {
          const weight = FIELD_WEIGHTS[field];
          score += weight;
          hits.push({ keyword: kw, field, weight });
        }
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { rule, score, hits };
    }
  }

  if (!best) return { ...FALLBACK };

  const label = PERSONA_LABELS[best.rule.persona] ?? best.rule.persona;
  // Confidence: saturates around a couple of solid title/skill matches.
  const confidence = Math.min(1, best.score / 10);

  // Build a human-readable reason from the strongest hits (title first).
  const byField = new Map<string, string[]>();
  for (const h of [...best.hits].sort((a, b) => b.weight - a.weight)) {
    const arr = byField.get(h.field) ?? [];
    if (!arr.includes(h.keyword)) arr.push(h.keyword);
    byField.set(h.field, arr);
  }
  const parts: string[] = [];
  if (byField.has("title")) parts.push(`your title “${profile.title}”`);
  if (byField.has("department") || byField.has("team")) parts.push(`the ${profile.team} team`);
  const techHits = [...(byField.get("skills") ?? []), ...(byField.get("systems") ?? [])].slice(0, 3);
  if (techHits.length) parts.push(`skills like ${techHits.join(", ")}`);

  const reason =
    parts.length > 0
      ? `Loaded the ${label} workspace because ${parts.join(", ")} map to this role.`
      : `Loaded the ${label} workspace from your profile.`;

  const signals = [...new Set(best.hits.map((h) => h.keyword))];

  return { personaId: best.rule.persona, label, confidence, reason, signals };
}

export const personaLabel = (personaId: string): string =>
  PERSONA_LABELS[personaId] ?? personaId;

export interface PersonaOption {
  id: string;
  label: string;
}

/** The known personas a user can pick directly during onboarding (admin last). */
export const PERSONA_OPTIONS: PersonaOption[] = Object.entries(PERSONA_LABELS).map(
  ([id, label]) => ({ id, label })
);

/** Route to land a persona on its primary screen. */
export const dashboardForPersona = (persona: string): string =>
  persona === "admin"
    ? "/admin/overview"
    : persona === "agentic-engineer"
    ? "/agents/marketplace"
    : `/${persona}/dashboard`;

/**
 * The reference profile that maps to a given persona — used to seed a
 * self-described user who picks a known persona directly. Derived from the
 * directory so there's a single source of truth (no persona is stored).
 */
export const archetypeForPersona = (personaId: string): EmployeeProfile | undefined =>
  EMPLOYEES.find((e) => resolvePersona(e).personaId === personaId);
