import { delay, uid, daysAgo, hoursAgo, minutesAgo } from "../../api/client";

/**
 * Capability 2.2 — Forum (persona-parameterized mock).
 *
 * ONE cross-persona discussion board, persona-aware: `getThreads(persona, …)`
 * returns threads whose topic tags match that persona's default interests (the
 * "?persona=<id>" contract). Post types: Question / Discussion / Proposal /
 * Announcement. Questions can accept an answer. `security` gets moderation
 * controls (pin / lock / remove) in the detail drawer.
 */

export interface ForumComment {
  id: string;
  author: string;
  body: string;
  ts: string;
  votes: number;
}

export type ThreadType = "Question" | "Discussion" | "Proposal" | "Announcement";

export interface Thread {
  id: string;
  type: ThreadType;
  title: string;
  body: string;
  author: string;
  tags: string[];
  votes: number;
  created_at: string;
  answered: boolean;
  followers: number;
  linked?: string;
  comments: ForumComment[];
  accepted_answer_id?: string;
}

export interface ThreadFilters {
  type?: string; // "all" or a ThreadType
  tag?: string; // "all" or a tag
  q?: string;
  sort?: "newest" | "top";
}

/** Per-persona default topic tags — drives the "For you" relevance of threads. */
export const PERSONA_TAGS: Record<string, string[]> = {
  "ai-engineer": ["prompt engineering", "LLM provider", "guardrail tuning", "cost", "RAG"],
  "agentic-engineer": ["agent design", "autonomy/HITL", "tool permissioning", "evals"],
  "data-scientist": ["feature engineering", "model comparison", "eval methodology", "dataset quality"],
  "app-engineer": ["Score spec", "resource deps", "GitOps", "Kong"],
  mlops: ["drift handling", "retraining", "GPU allocation", "reliability"],
  security: ["policy enforcement", "compliance", "incident reviews", "access governance"],
  "data-engineer": ["source changes", "schema evolution", "pipeline failures", "feature store", "lineage"],
};

const THREADS: Record<string, Thread[]> = {
  "ai-engineer": [
    {
      id: "th_ai_1",
      type: "Question",
      title: "Best way to reduce token cost on the support-rag retrieval step?",
      body: "We re-embed the full context window on every turn. Faithfulness is fine at 0.94 but cost/day crept to $60. Anyone tried caching retrieved chunks per session?",
      author: "maya.k",
      tags: ["cost", "RAG", "prompt engineering"],
      votes: 23,
      created_at: hoursAgo(4),
      answered: true,
      followers: 12,
      linked: "support-rag",
      accepted_answer_id: "cm_ai_1b",
      comments: [
        { id: "cm_ai_1a", author: "raj.p", body: "Try a per-session chunk cache keyed on doc hash — cut our re-embeds ~40%.", ts: hoursAgo(3), votes: 5 },
        { id: "cm_ai_1b", author: "lena.w", body: "We moved retrieval to a cheaper embedding model (text-embedding-3-small) for first pass, re-rank with large only on top-20. Cost down 55%, faithfulness unchanged.", ts: hoursAgo(2), votes: 18 },
      ],
    },
    {
      id: "th_ai_2",
      type: "Discussion",
      title: "Standardizing guardrail tuning across LLM apps",
      body: "Every team hand-rolls their own guardrail thresholds. Should we ship a shared guardrail config in the catalog?",
      author: "sam.o",
      tags: ["guardrail tuning", "LLM provider"],
      votes: 14,
      created_at: hoursAgo(9),
      answered: false,
      followers: 8,
      comments: [
        { id: "cm_ai_2a", author: "maya.k", body: "+1 — docs-assistant and support-rag already drifted apart on jailbreak filters.", ts: hoursAgo(8), votes: 4 },
      ],
    },
    {
      id: "th_ai_3",
      type: "Question",
      title: "OpenAI vs Anthropic for the docs-assistant rewrite?",
      body: "Considering switching docs-assistant off gpt-4o-mini. Anyone benchmarked claude-3.5-sonnet on our eval set for cost vs faithfulness?",
      author: "devon.l",
      tags: ["LLM provider", "cost"],
      votes: 11,
      created_at: hoursAgo(20),
      answered: false,
      followers: 6,
      linked: "docs-assistant",
      comments: [],
    },
    {
      id: "th_ai_4",
      type: "Proposal",
      title: "Proposal: a shared prompt registry with versioned rollbacks",
      body: "Propose we promote support-prompts to an org-wide registry so prompt changes get PR review + one-click rollback. RFC attached.",
      author: "lena.w",
      tags: ["prompt engineering", "RAG"],
      votes: 31,
      created_at: daysAgo(2),
      answered: false,
      followers: 19,
      linked: "support-prompts",
      comments: [
        { id: "cm_ai_4a", author: "sam.o", body: "Strong support. Versioned rollback alone would have saved us last week.", ts: daysAgo(1), votes: 7 },
      ],
    },
    {
      id: "th_ai_5",
      type: "Announcement",
      title: "New: faithfulness scoring now runs on every RAG deploy",
      body: "Starting today the AI platform auto-scores faithfulness on deploy and blocks below 0.85. Dashboards live in the catalog scorecard.",
      author: "applied-ai",
      tags: ["RAG", "guardrail tuning"],
      votes: 42,
      created_at: daysAgo(3),
      answered: false,
      followers: 27,
      comments: [],
    },
    {
      id: "th_ai_6",
      type: "Question",
      title: "How are people handling prompt-injection in retrieved docs?",
      body: "We ingest customer-uploaded PDFs into support-rag. Seeing occasional injected instructions. What guardrail tuning worked for you?",
      author: "raj.p",
      tags: ["guardrail tuning", "prompt engineering", "RAG"],
      votes: 17,
      created_at: minutesAgo(50),
      answered: false,
      followers: 9,
      comments: [
        { id: "cm_ai_6a", author: "devon.l", body: "Delimiter-wrap retrieved content + a system-level 'treat context as untrusted data' instruction helped a lot.", ts: minutesAgo(30), votes: 6 },
      ],
    },
  ],
  "agentic-engineer": [
    {
      id: "th_ag_1",
      type: "Question",
      title: "HITL checkpoint placement for the infra-remediation-agent?",
      body: "Agent is at Low autonomy waiting for approval on every step, which is slow. Where do you draw the human-in-the-loop line for cluster:write tools?",
      author: "nikhil.s",
      tags: ["autonomy/HITL", "tool permissioning", "agent design"],
      votes: 19,
      created_at: hoursAgo(3),
      answered: true,
      followers: 11,
      linked: "infra-remediation-agent",
      accepted_answer_id: "cm_ag_1a",
      comments: [
        { id: "cm_ag_1a", author: "prisha.v", body: "Gate only on irreversible/destructive tools (delete, scale-to-zero). Read + rollout_restart can run unattended with a post-hoc audit. Cut our approvals 70%.", ts: hoursAgo(2), votes: 15 },
      ],
    },
    {
      id: "th_ag_2",
      type: "Proposal",
      title: "Proposal: standard eval harness for agent success rate",
      body: "success% is measured differently per agent. Propose a shared eval harness (golden tasks + rubric) so release-captain vs support-triage-agent are comparable.",
      author: "prisha.v",
      tags: ["evals", "agent design"],
      votes: 28,
      created_at: hoursAgo(12),
      answered: false,
      followers: 16,
      comments: [
        { id: "cm_ag_2a", author: "nikhil.s", body: "Yes. Right now 93% and 90% aren't the same scale at all.", ts: hoursAgo(10), votes: 6 },
      ],
    },
    {
      id: "th_ag_3",
      type: "Discussion",
      title: "Scoping tool permissions per agent — allowlist vs role?",
      body: "Should tool permissioning be an explicit per-agent allowlist, or inherited from an IAM-style role? Leaning allowlist for auditability.",
      author: "omar.d",
      tags: ["tool permissioning", "agent design"],
      votes: 13,
      created_at: hoursAgo(22),
      answered: false,
      followers: 7,
      comments: [],
    },
    {
      id: "th_ag_4",
      type: "Question",
      title: "release-captain paused after a bad rollout — how to add a dry-run mode?",
      body: "High-autonomy release-captain triggered a rollout it shouldn't have. Looking for a plan-only 'observe' pass before it acts.",
      author: "tara.m",
      tags: ["autonomy/HITL", "agent design", "evals"],
      votes: 21,
      created_at: daysAgo(1),
      answered: false,
      followers: 14,
      linked: "release-captain",
      comments: [
        { id: "cm_ag_4a", author: "omar.d", body: "We run a shadow plan step that emits intended tool calls to a queue for review before enabling act.", ts: hoursAgo(20), votes: 8 },
      ],
    },
    {
      id: "th_ag_5",
      type: "Announcement",
      title: "claude-agent-runtime v2 adds per-tool autonomy budgets",
      body: "The agent runtime now supports per-tool autonomy budgets and automatic HITL escalation when a budget is exceeded. Migration guide in docs.",
      author: "autonomous-systems",
      tags: ["autonomy/HITL", "tool permissioning"],
      votes: 37,
      created_at: daysAgo(2),
      answered: false,
      followers: 22,
      linked: "claude-agent-runtime",
      comments: [],
    },
    {
      id: "th_ag_6",
      type: "Discussion",
      title: "What makes a good agent-design golden task set?",
      body: "Building evals for support-triage-agent. How many golden tasks before success% is trustworthy, and how do you avoid overfitting the agent to them?",
      author: "prisha.v",
      tags: ["evals", "agent design"],
      votes: 9,
      created_at: minutesAgo(40),
      answered: false,
      followers: 5,
      comments: [],
    },
  ],
  "data-scientist": [
    {
      id: "th_ds_1",
      type: "Question",
      title: "fraud-detection AUC 0.947 in staging but drops in shadow — why?",
      body: "Offline AUC is great but shadow scoring underperforms. Suspect feature engineering leakage. How do you audit for train/serve skew?",
      author: "aisha.r",
      tags: ["feature engineering", "eval methodology", "model comparison"],
      votes: 20,
      created_at: hoursAgo(5),
      answered: true,
      followers: 13,
      linked: "fraud-detection",
      accepted_answer_id: "cm_ds_1b",
      comments: [
        { id: "cm_ds_1a", author: "ben.t", body: "Classic. Check any feature that uses post-event aggregates.", ts: hoursAgo(4), votes: 4 },
        { id: "cm_ds_1b", author: "sofia.n", body: "It was a time-window feature computed with future rows. Recompute point-in-time from the feature store and the gap disappears.", ts: hoursAgo(3), votes: 16 },
      ],
    },
    {
      id: "th_ds_2",
      type: "Discussion",
      title: "Comparing churn-predictor v3 vs v4 — which metric decides?",
      body: "v4 has higher AUC but worse calibration. For the churn use case, should model comparison weight calibration over ranking?",
      author: "ben.t",
      tags: ["model comparison", "eval methodology"],
      votes: 15,
      created_at: hoursAgo(11),
      answered: false,
      followers: 9,
      linked: "churn-predictor",
      comments: [
        { id: "cm_ds_2a", author: "aisha.r", body: "For retention offers, calibration matters more — you're thresholding probabilities.", ts: hoursAgo(9), votes: 7 },
      ],
    },
    {
      id: "th_ds_3",
      type: "Question",
      title: "customer-churn-2026 dataset quality — 3% label noise acceptable?",
      body: "Found ~3% mislabeled records in the churn dataset. Worth a relabel pass or fine within noise tolerance for this model class?",
      author: "sofia.n",
      tags: ["dataset quality", "eval methodology"],
      votes: 10,
      created_at: hoursAgo(18),
      answered: false,
      followers: 6,
      linked: "customer-churn-2026",
      comments: [],
    },
    {
      id: "th_ds_4",
      type: "Proposal",
      title: "Proposal: shared feature-engineering library for tabular models",
      body: "We keep re-implementing the same rolling aggregates. Propose a vetted feature-engineering lib published to the feature store.",
      author: "aisha.r",
      tags: ["feature engineering", "dataset quality"],
      votes: 26,
      created_at: daysAgo(1),
      answered: false,
      followers: 15,
      comments: [
        { id: "cm_ds_4a", author: "ben.t", body: "Would also standardize point-in-time correctness, which is where bugs hide.", ts: hoursAgo(22), votes: 5 },
      ],
    },
    {
      id: "th_ds_5",
      type: "Announcement",
      title: "New eval methodology guide: temporal splits by default",
      body: "The DS platform now recommends (and templates) temporal train/test splits for all time-dependent models. Random splits deprecated.",
      author: "ds-team",
      tags: ["eval methodology", "model comparison"],
      votes: 33,
      created_at: daysAgo(2),
      answered: false,
      followers: 20,
      comments: [],
    },
    {
      id: "th_ds_6",
      type: "Question",
      title: "recsys-tower experiment pending approval — what unblocks review?",
      body: "AUC 0.906 on clickstream-90d, been pending approval 9h. What eval artifacts does the reviewer need to sign off?",
      author: "ben.t",
      tags: ["eval methodology", "model comparison"],
      votes: 8,
      created_at: minutesAgo(45),
      answered: false,
      followers: 4,
      linked: "recsys-tower",
      comments: [],
    },
  ],
  "app-engineer": [
    {
      id: "th_app_1",
      type: "Question",
      title: "inventory-svc stuck Out of sync in staging — Score spec issue?",
      body: "GitOps shows inventory-svc out of sync after a Score spec change. Diff looks clean. Anyone hit a resource-deps ordering bug?",
      author: "chris.a",
      tags: ["GitOps", "Score spec", "resource deps"],
      votes: 18,
      created_at: hoursAgo(2),
      answered: true,
      followers: 10,
      linked: "inventory-svc",
      accepted_answer_id: "cm_app_1a",
      comments: [
        { id: "cm_app_1a", author: "dana.f", body: "Your Score spec declared the DB as a resource but the provisioner hadn't reconciled it yet — add an explicit dependsOn and the sync completes.", ts: hoursAgo(1), votes: 12 },
      ],
    },
    {
      id: "th_app_2",
      type: "Discussion",
      title: "Kong route conventions — path prefix vs host-based?",
      body: "checkout-api and payments-gateway use path prefixes; notifications wants host-based. Should we standardize Kong routing org-wide?",
      author: "dana.f",
      tags: ["Kong", "GitOps"],
      votes: 12,
      created_at: hoursAgo(14),
      answered: false,
      followers: 7,
      comments: [
        { id: "cm_app_2a", author: "chris.a", body: "Path prefix is easier to reason about in the catalog. Host-based only when we truly need tenant isolation.", ts: hoursAgo(12), votes: 4 },
      ],
    },
    {
      id: "th_app_3",
      type: "Question",
      title: "How to express a shared Redis dependency in Score?",
      body: "Two services need the same Redis. Do I declare resource deps per-service or a shared resource? Worried about GitOps drift.",
      author: "priya.m",
      tags: ["Score spec", "resource deps"],
      votes: 9,
      created_at: hoursAgo(19),
      answered: false,
      followers: 5,
      comments: [],
    },
    {
      id: "th_app_4",
      type: "Proposal",
      title: "Proposal: golden-path Score spec template per service tier",
      body: "New services copy-paste Score specs and drift. Propose tiered templates (web / worker / API) with sane resource deps + Kong defaults baked in.",
      author: "chris.a",
      tags: ["Score spec", "GitOps", "Kong"],
      votes: 24,
      created_at: daysAgo(1),
      answered: false,
      followers: 14,
      comments: [
        { id: "cm_app_4a", author: "priya.m", body: "Please. Half our sync failures are avoidable spec mistakes.", ts: hoursAgo(20), votes: 6 },
      ],
    },
    {
      id: "th_app_5",
      type: "Announcement",
      title: "GitOps auto-sync now enabled for staging by default",
      body: "Staging environments now auto-sync on merge. Prod stays manual-promote. Out-of-sync alerts route to your team channel.",
      author: "platform",
      tags: ["GitOps", "resource deps"],
      votes: 29,
      created_at: daysAgo(2),
      answered: false,
      followers: 17,
      comments: [],
    },
    {
      id: "th_app_6",
      type: "Question",
      title: "notifications service Progressing forever — Kong health check?",
      body: "notifications shows Progressing and never goes Healthy. Suspect the Kong upstream health check path is wrong. What's the default?",
      author: "dana.f",
      tags: ["Kong", "GitOps"],
      votes: 7,
      created_at: minutesAgo(35),
      answered: false,
      followers: 4,
      linked: "notifications",
      comments: [],
    },
  ],
  mlops: [
    {
      id: "th_ml_1",
      type: "Question",
      title: "churn-drift-monitor at 0.71 — auto-retrain or investigate first?",
      body: "Drift crossed the 0.60 auto rule on churn-training. Do you let it auto-retrain or hold and investigate the source shift first?",
      author: "victor.h",
      tags: ["drift handling", "retraining", "reliability"],
      votes: 22,
      created_at: hoursAgo(2),
      answered: true,
      followers: 13,
      linked: "churn-drift-monitor",
      accepted_answer_id: "cm_ml_1b",
      comments: [
        { id: "cm_ml_1a", author: "grace.o", body: "Auto-retrain is fine if the drift is covariate, not concept. Check feature distributions first.", ts: hoursAgo(1), votes: 6 },
        { id: "cm_ml_1b", author: "hassan.q", body: "We gate auto-retrain on a data-quality check. If upstream quality dipped, retraining just bakes in bad data — hold and page data-eng.", ts: minutesAgo(50), votes: 14 },
      ],
    },
    {
      id: "th_ml_2",
      type: "Question",
      title: "ltv-training keeps failing on GPU allocation — a100 contention?",
      body: "ltv-training (manual only) fails intermittently grabbing gpu-a100. Is anyone else seeing a100 contention around the churn-training window?",
      author: "grace.o",
      tags: ["GPU allocation", "reliability"],
      votes: 16,
      created_at: hoursAgo(8),
      answered: false,
      followers: 9,
      linked: "ltv-training",
      comments: [
        { id: "cm_ml_2a", author: "victor.h", body: "Yes — churn-training's 6h cron overlaps. Stagger your schedule or request a preemptible pool.", ts: hoursAgo(7), votes: 5 },
      ],
    },
    {
      id: "th_ml_3",
      type: "Discussion",
      title: "Retraining cadence — schedule-based vs drift-triggered?",
      body: "Half our pipelines are cron, half are drift-triggered. Which is more reliable in practice for tabular models?",
      author: "hassan.q",
      tags: ["retraining", "drift handling", "reliability"],
      votes: 13,
      created_at: hoursAgo(16),
      answered: false,
      followers: 8,
      comments: [],
    },
    {
      id: "th_ml_4",
      type: "Proposal",
      title: "Proposal: preemptible GPU pool for non-critical training",
      body: "Propose a shared preemptible gpu-a100 pool for experiments/retraining so critical serving keeps its reserved capacity. Cost model attached.",
      author: "victor.h",
      tags: ["GPU allocation", "reliability", "retraining"],
      votes: 27,
      created_at: daysAgo(1),
      answered: false,
      followers: 15,
      comments: [
        { id: "cm_ml_4a", author: "grace.o", body: "Would fix the a100 contention we keep hitting on ltv-training.", ts: hoursAgo(22), votes: 7 },
      ],
    },
    {
      id: "th_ml_5",
      type: "Announcement",
      title: "Drift monitors now support per-feature thresholds",
      body: "You can now set drift thresholds per feature instead of one global number. churn-drift-monitor migrated as the reference example.",
      author: "ml-platform",
      tags: ["drift handling", "reliability"],
      votes: 31,
      created_at: daysAgo(2),
      answered: false,
      followers: 18,
      comments: [],
    },
    {
      id: "th_ml_6",
      type: "Question",
      title: "How do you SLO a serving endpoint's reliability?",
      body: "churn-serving is Ready but I have no reliability SLO. What metrics (latency, error rate, staleness) do you track and alert on?",
      author: "grace.o",
      tags: ["reliability", "drift handling"],
      votes: 8,
      created_at: minutesAgo(38),
      answered: false,
      followers: 5,
      linked: "churn-serving",
      comments: [],
    },
  ],
  security: [
    {
      id: "th_sec_1",
      type: "Question",
      title: "checkout-api non-compliant (2 violations) — which policy blocks release?",
      body: "checkout-api dropped to 88% OPA and is Non-compliant. Which of the require-resource-limits violations is release-blocking vs advisory?",
      author: "elena.v",
      tags: ["policy enforcement", "compliance"],
      votes: 17,
      created_at: hoursAgo(3),
      answered: true,
      followers: 11,
      linked: "checkout-api",
      accepted_answer_id: "cm_sec_1a",
      comments: [
        { id: "cm_sec_1a", author: "marcus.b", body: "The missing memory limit is hard-block (require-resource-limits is Enforced). The label violation is advisory. Fix the limit and it clears.", ts: hoursAgo(2), votes: 13 },
      ],
    },
    {
      id: "th_sec_2",
      type: "Discussion",
      title: "Access governance for restricted datasets — team vs individual grants?",
      body: "customer-churn-2026 is restricted with PII. Should access be team-scoped or per-individual with expiry? Auditors are asking.",
      author: "marcus.b",
      tags: ["access governance", "compliance"],
      votes: 15,
      created_at: hoursAgo(10),
      answered: false,
      followers: 9,
      linked: "customer-churn-2026",
      comments: [
        { id: "cm_sec_2a", author: "elena.v", body: "Per-individual with 90-day expiry for PII datasets. Team grants for everything else.", ts: hoursAgo(8), votes: 6 },
      ],
    },
    {
      id: "th_sec_3",
      type: "Proposal",
      title: "Proposal: block deploys below 80% OPA score org-wide",
      body: "payments_reconcile (74%) and customer-churn-2026 (79%) shipped despite low scores. Propose a hard gate at 80% with a documented exception path.",
      author: "elena.v",
      tags: ["policy enforcement", "compliance", "access governance"],
      votes: 30,
      created_at: hoursAgo(15),
      answered: false,
      followers: 19,
      comments: [
        { id: "cm_sec_3a", author: "marcus.b", body: "Support, with a break-glass exception that auto-files an incident review.", ts: hoursAgo(13), votes: 8 },
      ],
    },
    {
      id: "th_sec_4",
      type: "Announcement",
      title: "Post-incident review: payments_reconcile PII exposure",
      body: "Summary and action items from the payments_reconcile incident review. Root cause was an unrestricted access grant; remediation tracked in the catalog.",
      author: "security",
      tags: ["incident reviews", "compliance", "access governance"],
      votes: 38,
      created_at: daysAgo(1),
      answered: false,
      followers: 24,
      linked: "payments_reconcile",
      comments: [
        { id: "cm_sec_4a", author: "priya.m", body: "Thanks for the transparency. The dependsOn fix is already merged on our side.", ts: hoursAgo(20), votes: 5 },
      ],
    },
    {
      id: "th_sec_5",
      type: "Question",
      title: "How to enforce require-resource-limits without breaking existing services?",
      body: "Turning require-resource-limits to Enforced will flag 4 services. What's the phased rollout that avoids blocking prod deploys on day one?",
      author: "marcus.b",
      tags: ["policy enforcement", "compliance"],
      votes: 12,
      created_at: hoursAgo(21),
      answered: false,
      followers: 7,
      linked: "require-resource-limits",
      comments: [],
    },
    {
      id: "th_sec_6",
      type: "Discussion",
      title: "Compliance evidence — automate collection from the catalog?",
      body: "Auditors want per-asset compliance evidence. Can we auto-export OPA scores + access grants from the catalog on a schedule?",
      author: "elena.v",
      tags: ["compliance", "access governance"],
      votes: 9,
      created_at: minutesAgo(42),
      answered: false,
      followers: 5,
      comments: [],
    },
  ],
  "data-engineer": [
    {
      id: "th_de_1",
      type: "Question",
      title: "feature_churn_signals failed — upstream schema evolution?",
      body: "feature_churn_signals dropped to 63% quality and failed. Suspect a source schema change renamed a column. How do you detect schema evolution early?",
      author: "kofi.a",
      tags: ["schema evolution", "pipeline failures", "source changes"],
      votes: 21,
      created_at: hoursAgo(3),
      answered: true,
      followers: 12,
      linked: "feature_churn_signals",
      accepted_answer_id: "cm_de_1b",
      comments: [
        { id: "cm_de_1a", author: "mei.l", body: "Contract tests on the source table catch renames before the pipeline runs.", ts: hoursAgo(2), votes: 5 },
        { id: "cm_de_1b", author: "yusuf.b", body: "It was a renamed column upstream. Add a schema-diff check as the first pipeline step and fail fast with a clear message instead of quality dropping silently.", ts: hoursAgo(1), votes: 15 },
      ],
    },
    {
      id: "th_de_2",
      type: "Discussion",
      title: "Lineage — how deep do you track for orders_daily_agg?",
      body: "analytics.orders_daily has 5 downstream consumers. Do you track lineage to column level or table level for impact analysis?",
      author: "mei.l",
      tags: ["lineage", "source changes"],
      votes: 14,
      created_at: hoursAgo(12),
      answered: false,
      followers: 8,
      linked: "orders_daily_agg",
      comments: [
        { id: "cm_de_2a", author: "kofi.a", body: "Column-level pays off the first time a source change breaks one downstream model and not the rest.", ts: hoursAgo(10), votes: 6 },
      ],
    },
    {
      id: "th_de_3",
      type: "Question",
      title: "feature store refresh — hourly vs on-demand for customer_activity?",
      body: "customer_activity refreshes hourly and feeds 3 models. Is on-demand refresh worth it, or does hourly staleness rarely matter?",
      author: "yusuf.b",
      tags: ["feature store", "lineage"],
      votes: 10,
      created_at: hoursAgo(17),
      answered: false,
      followers: 6,
      linked: "customer_activity",
      comments: [],
    },
    {
      id: "th_de_4",
      type: "Proposal",
      title: "Proposal: mandatory schema contracts on all source tables",
      body: "Most pipeline failures trace to unannounced source changes. Propose enforced schema contracts + a change-notification hook before pipelines consume.",
      author: "kofi.a",
      tags: ["schema evolution", "source changes", "pipeline failures"],
      votes: 25,
      created_at: daysAgo(1),
      answered: false,
      followers: 15,
      comments: [
        { id: "cm_de_4a", author: "mei.l", body: "This would have prevented the feature_churn_signals failure entirely.", ts: hoursAgo(22), votes: 7 },
      ],
    },
    {
      id: "th_de_5",
      type: "Announcement",
      title: "New: automatic lineage capture across all published datasets",
      body: "The data platform now auto-captures table + column lineage for every published dataset. Impact analysis is one click from the catalog.",
      author: "data-platform",
      tags: ["lineage", "feature store"],
      votes: 34,
      created_at: daysAgo(2),
      answered: false,
      followers: 21,
      comments: [],
    },
    {
      id: "th_de_6",
      type: "Question",
      title: "Backfilling after a source change without double-counting?",
      body: "A source change means I need to backfill orders_daily_agg. How do you backfill idempotently so downstream consumers don't double-count?",
      author: "mei.l",
      tags: ["source changes", "pipeline failures", "lineage"],
      votes: 8,
      created_at: minutesAgo(36),
      answered: false,
      followers: 4,
      comments: [],
    },
  ],
};

/** All tags present in a persona's threads (for the tag filter). */
export function getPersonaTags(personaId: string): string[] {
  const fromThreads = new Set<string>();
  (THREADS[personaId] ?? []).forEach((t) => t.tags.forEach((tag) => fromThreads.add(tag)));
  // seed with the persona defaults so the filter is stable even if data changes
  (PERSONA_TAGS[personaId] ?? []).forEach((tag) => fromThreads.add(tag));
  return Array.from(fromThreads);
}

export async function getThreads(
  personaId: string,
  filters: ThreadFilters = {}
): Promise<Thread[]> {
  await delay();
  const rows = THREADS[personaId] ?? [];
  const q = (filters.q ?? "").trim().toLowerCase();
  const filtered = rows.filter(
    (t) =>
      (!q ||
        t.title.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))) &&
      (!filters.type || filters.type === "all" || t.type === filters.type) &&
      (!filters.tag || filters.tag === "all" || t.tags.includes(filters.tag))
  );
  const sorted = [...filtered];
  if (filters.sort === "top") {
    sorted.sort((a, b) => b.votes - a.votes);
  } else {
    // newest (default)
    sorted.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  return sorted;
}

export async function getThread(
  personaId: string,
  id: string
): Promise<Thread | undefined> {
  await delay(200);
  return (THREADS[personaId] ?? []).find((t) => t.id === id);
}

export async function voteThread(
  id: string,
  dir: "up" | "down"
): Promise<{ id: string; votes_delta: number }> {
  await delay(200);
  return { id, votes_delta: dir === "up" ? 1 : -1 };
}

export async function addComment(
  id: string,
  body: string
): Promise<{ comment_id: string }> {
  await delay();
  void id;
  void body;
  return { comment_id: uid("cm") };
}

export async function acceptAnswer(
  id: string,
  commentId: string
): Promise<{ id: string; accepted_answer_id: string }> {
  await delay(200);
  return { id, accepted_answer_id: commentId };
}

export async function followThread(
  id: string
): Promise<{ id: string; following: boolean }> {
  await delay(200);
  return { id, following: true };
}

export async function moderate(
  id: string,
  action: "pin" | "lock" | "remove"
): Promise<{ id: string; action: "pin" | "lock" | "remove"; ok: boolean }> {
  await delay(200);
  return { id, action, ok: true };
}
