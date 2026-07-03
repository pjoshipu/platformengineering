import { delay, uid, daysAgo, hoursAgo, minutesAgo } from "../../api/client";

/**
 * IDP Agent Marketplace registry (mock). Data model per
 * IDP_SCREEN_REQUIREMENTS.md. Contains all 76 marketplace agents
 * (28 Harness baseline + 48 net-new by persona) plus a few team-built
 * "custom" agents. Detail fields (full description, steps, inputs, safety,
 * executions) are derived from the card data so all 76 have realistic content.
 */

export type Category =
  | "Code & Testing" | "Data & ML" | "Infrastructure" | "Security"
  | "Observability" | "Collaboration" | "Cost";
export type Scope = "Project" | "Org" | "Team" | "Pipeline";
export type TriggerType =
  | "Manual" | "Pipeline stage" | "Schedule" | "Event" | "Threshold" | "Continuous";
export type AgentStatus = "Active" | "Beta" | "Deprecated" | "Under review";
export type PermissionScope = "Read-only" | "Write" | "Scoped" | "Sandboxed";

export interface AgentInput {
  name: string; type: string; required: boolean;
  default?: string; description: string; source: string;
}
export interface AgentTool {
  name: string; permission_scope: PermissionScope; description: string;
}
export interface AgentSafety {
  max_steps: number; cost_cap_usd: number; blocked_actions: string[];
  human_checkpoint: { enabled: boolean; at_step?: number; reviewer_prompt?: string };
  rollback_on_failure: boolean;
}
export interface AgentExecution {
  run_id: string; triggered_by: string; started: string; duration: string;
  steps: number; cost: number; outcome: string;
}
export interface Agent {
  id: string; name: string; description_short: string; description_full: string;
  icon: string; category: Category; scope: Scope; available_on: string; version: string;
  personas: string[]; tab: "marketplace" | "custom"; author: string;
  trigger: { type: TriggerType; config: string };
  steps_explanation: string[]; prerequisites: string[];
  inputs: AgentInput[]; tools: AgentTool[]; safety: AgentSafety;
  status: AgentStatus; use_count: number; rating: number;
  created_at: string; updated_at: string;
}

export const CATEGORIES: Category[] = [
  "Code & Testing", "Data & ML", "Infrastructure", "Security",
  "Observability", "Collaboration", "Cost",
];
export const SCOPES: Scope[] = ["Project", "Org", "Team", "Pipeline"];
export const PERSONA_NAMES = [
  "AI Engineer", "Agentic Engineer", "Data Scientist", "App/Platform Engineer",
  "MLOps Engineer", "Security/Compliance Engineer", "Data Engineer",
];
export const SORTS = ["Most used", "Newest", "A-Z", "Rating"] as const;

/** Map an IDP persona id (from auth) to its marketplace display name. */
export const personaDisplayName = (id: string): string =>
  ({
    "ai-engineer": "AI Engineer",
    "agentic-engineer": "Agentic Engineer",
    "data-scientist": "Data Scientist",
    "app-engineer": "App/Platform Engineer",
    mlops: "MLOps Engineer",
    security: "Security/Compliance Engineer",
    "data-engineer": "Data Engineer",
  }[id] ?? "");

// ---------------------------------------------------------------------------
// Derivation helpers
// ---------------------------------------------------------------------------

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// small stable hash for seeded numbers
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function toolFromPhrase(phrase: string): AgentTool {
  const p = phrase.trim();
  const l = p.toLowerCase();
  let permission_scope: PermissionScope;
  if (/^(write|create|post|assign|send|pre-fill|prefill|track|draft|notify|file)/.test(l)) permission_scope = "Write";
  else if (/^(execute|run|trigger|sync|auto-sync|apply|refresh|force-stop|interrupt|block|enforce|remediate|initiate)/.test(l)) permission_scope = "Sandboxed";
  else if (/^(call|query)/.test(l)) permission_scope = "Scoped";
  else permission_scope = "Read-only";
  return { name: cap(p), permission_scope, description: `${cap(p)}.` };
}

function deriveInputs(a: { trigger: { type: TriggerType }; scope: Scope }): AgentInput[] {
  const base: AgentInput[] = [
    { name: "target", type: "string", required: true, description: "Resource the agent operates on (repo, model, pipeline, dataset, or service).", source: "auto-detected" },
    { name: "environment", type: "string", required: false, default: "dev", description: "Environment context for the run.", source: "pipeline variable" },
  ];
  if (a.trigger.type === "Schedule" || a.trigger.type === "Continuous")
    base.push({ name: "lookback_window", type: "string", required: false, default: "24h", description: "Time window to analyze.", source: "user input" });
  if (a.trigger.type === "Event")
    base.push({ name: "event_payload", type: "file path", required: true, description: "The triggering event payload.", source: "auto-detected" });
  return base;
}

function deriveSafety(name: string, tools: AgentTool[], scope: Scope): AgentSafety {
  const h = hash(name);
  const hasWrite = tools.some((t) => t.permission_scope !== "Read-only");
  return {
    max_steps: 8 + (h % 18),
    cost_cap_usd: [0.5, 1, 2, 5][h % 4],
    blocked_actions: [
      "Cannot push directly to the main branch",
      "Cannot delete production resources",
      ...(scope === "Org" ? ["Cannot modify org-wide policy without approval"] : []),
    ],
    human_checkpoint: hasWrite
      ? { enabled: true, at_step: 3 + (h % 3), reviewer_prompt: "Review the proposed change before it is applied." }
      : { enabled: false },
    rollback_on_failure: hasWrite,
  };
}

function deriveExecutions(name: string): AgentExecution[] {
  const h = hash(name);
  const outcomes = ["Success", "Success", "Failed", "Stopped", "Awaiting human review", "Rolled back"];
  return Array.from({ length: 3 }).map((_, i) => ({
    run_id: `run_${slug(name).slice(0, 6)}_${100 + ((h + i) % 900)}`,
    triggered_by: ["schedule", "PR #4821", "manual (p.joshipura)", "pipeline: build-prod"][(h + i) % 4],
    started: [minutesAgo(18), hoursAgo(5), daysAgo(1)][i],
    duration: `${1 + ((h + i) % 6)}m ${((h * (i + 1)) % 60)}s`,
    steps: 4 + ((h + i) % 12),
    cost: +(0.02 + ((h + i) % 30) / 100).toFixed(2),
    outcome: outcomes[(h + i) % outcomes.length],
  }));
}

function deriveSteps(name: string, tools: AgentTool[], trigger: TriggerType): string[] {
  const reads = tools.filter((t) => t.permission_scope === "Read-only").map((t) => t.name.toLowerCase());
  const writes = tools.filter((t) => t.permission_scope !== "Read-only").map((t) => t.name.toLowerCase());
  return [
    `Triggered by ${trigger.toLowerCase()} — gathers context: ${reads.slice(0, 2).join(", ") || "reads the target"}.`,
    `Reasons over the collected data to determine the required action.`,
    `Acts using its permitted tools${writes.length ? ` (${writes.slice(0, 2).join(", ")})` : ""}.`,
    `Observes the result, and either completes, pauses at a human checkpoint, or rolls back on failure.`,
  ];
}

// ---------------------------------------------------------------------------
// Raw agent definitions
// ---------------------------------------------------------------------------

interface Raw {
  name: string;
  short: string;
  category: Category;
  scope: Scope;
  personas: string[];
  trigger: { type: TriggerType; config: string };
  toolPhrases: string[];
  available_on?: string;
  author?: string;
  tab?: "marketplace" | "custom";
  status?: AgentStatus;
}

const HARNESS_ON = "Also available on Harness Marketplace";
const APE = "App/Platform Engineer";
const SEC = "Security/Compliance Engineer";

// 28 Harness baseline agents (scope Project, v1.0.0, on Harness Marketplace)
const HARNESS: [string, string, Category, string[]][] = [
  ["Feature file commit", "Commits a generated AISDLC feature file to a new Harness pipeline branch.", "Code & Testing", [APE]],
  ["False positive triage", "Triages security scan findings as true or false positives.", "Security", [SEC]],
  ["Pull request authoring", "Writes a pull request body for a committed AISDLC feature file and associated code changes.", "Code & Testing", [APE]],
  ["Jira feature ingestion", "Turns the triggering Jira issue into a scoped Features.md and a structured feature definition.", "Collaboration", [APE]],
  ["Outdated test update", "Reads triaged outdated tests and updates each one to reflect current code behavior.", "Code & Testing", [APE]],
  ["Plan execution", "Implements the committed coding plan for the triggering pull request.", "Code & Testing", [APE]],
  ["Regression repair", "Reads triaged regressions and fixes each one in the codebase.", "Code & Testing", [APE]],
  ["Verification implementation", "Creates Harness Continuous Verification monitored services and configured verification steps.", "Observability", [APE]],
  ["Verification evaluation", "Performs a read-only preview of Continuous Verification configuration.", "Observability", [APE]],
  ["Verification analysis", "Analyzes application source code and Kubernetes manifests to surface verification gaps.", "Observability", [APE]],
  ["Feature flag cleanup", "Safely removes references to a stale feature flag and keeps the chosen variant behavior.", "Code & Testing", [APE]],
  ["Code review", "Reviews the pull request that triggered the pipeline, generating review comments and suggestions.", "Code & Testing", [APE]],
  ["Spec authoring", "Generates a product spec for each features file added or modified in the triggering pull request.", "Code & Testing", [APE]],
  ["IaCM cost remediation", "Evaluates a cloud-cost recommendation against an OpenTofu/Terraform plan and applies fixes.", "Cost", [APE]],
  ["Dockerfile cache optimization", "Restructures Dockerfiles and .dockerignore files for BuildKit layer caching.", "Infrastructure", [APE]],
  ["CI intelligence enablement", "Auto-enables Harness CI cache and build intelligence across pipelines.", "Infrastructure", [APE]],
  ["Code coverage generation", "Analyzes the codebase and generates meaningful unit tests to close coverage gaps.", "Code & Testing", [APE]],
  ["IaCM remediation", "Remediates IaCM drift, security, and cloud-cost findings.", "Infrastructure", [APE]],
  ["Compliance audit", "Audits Harness CI/CD configurations against secure-SDLC standards.", "Security", [SEC]],
  ["Test failure classification", "Classifies end-to-end test failures as application regressions or infrastructure/flakiness issues.", "Code & Testing", [APE]],
  ["Feature spec planning", "Generates a product spec and coding plan for each features file in the triggering pull request.", "Code & Testing", [APE]],
  ["Kubernetes manifest remediation", "Analyzes Kubernetes and Helm deployment failures and produces remediated manifests.", "Infrastructure", [APE]],
  ["CI failure autofix", "Identifies the root cause of a CI pipeline failure and applies a targeted fix.", "Code & Testing", [APE]],
  ["Mythos readiness collection", "Collects raw Harness platform configuration data (pipelines, connectors, etc.) for analysis.", "Infrastructure", [APE]],
  ["Test doctor", "Fixes flaky tests, speeds up slow tests, and optimizes fixtures within the test suite.", "Code & Testing", [APE]],
  ["Template audit", "Audits Harness CI/CD templates across a project, analyzing usage and compliance.", "Infrastructure", [APE]],
  ["IaC discovery", "Inventories live AWS resources via connector and compares them against IaC definitions to find gaps.", "Infrastructure", [APE]],
  ["Vulnerability remediation", "Closes the gap between vulnerability detection and verified fixes applied to the codebase.", "Security", [SEC]],
];

const harnessRaw: Raw[] = HARNESS.map(([name, short, category, personas]) => ({
  name, short, category, personas, scope: "Project" as Scope,
  trigger: { type: "Pipeline stage" as TriggerType, config: "Runs at the configured pipeline stage" },
  toolPhrases: ["Read repository files", "Analyze context", "Write changes to branch", "Create PR"],
  available_on: HARNESS_ON, author: "Harness",
}));

// 48 net-new agents by persona
const NEW: Raw[] = [
  // AI Engineer (6)
  { name: "Prompt drift detector", short: "Monitors live prompt performance and alerts when faithfulness or hallucination rate shifts beyond threshold; recommends prompt changes from recent trace patterns.", category: "Observability", scope: "Project", personas: ["AI Engineer"], trigger: { type: "Schedule", config: "Hourly" }, toolPhrases: ["Read trace logs", "Read prompt registry", "Write alert", "Create forum post"] },
  { name: "RAG quality auditor", short: "Analyzes retrieval quality across a RAG pipeline (chunk size, overlap, embedding fit, hit rate) and produces ranked improvement recommendations.", category: "Data & ML", scope: "Project", personas: ["AI Engineer"], trigger: { type: "Manual", config: "Manual or schedule" }, toolPhrases: ["Read vector store config", "Sample traces", "Read embedding model config", "Write report"] },
  { name: "LLM cost optimizer", short: "Reviews token usage across all LLM apps, identifies high-cost calls, and recommends compression, model downgrade, or caching with estimated savings.", category: "Cost", scope: "Org", personas: ["AI Engineer"], trigger: { type: "Schedule", config: "Daily" }, toolPhrases: ["Read cost metrics", "Read prompt registry", "Read model config", "Write recommendations report"] },
  { name: "Guardrail coverage scanner", short: "Audits all deployed LLM apps for missing or disabled guardrails and produces a prioritized gap report with one-click remediation links.", category: "Security", scope: "Org", personas: ["AI Engineer"], trigger: { type: "Schedule", config: "Schedule or manual" }, toolPhrases: ["Read guardrail config per app", "Write gap report", "Create policy ticket"] },
  { name: "Canary auto-analyst", short: "During a canary rollout, continuously compares prod vs canary quality metrics and writes a plain-English promote/rollback recommendation with evidence.", category: "Observability", scope: "Project", personas: ["AI Engineer"], trigger: { type: "Event", config: "Canary deployed" }, toolPhrases: ["Read canary metrics", "Read prod metrics", "Write recommendation", "Post to forum thread"] },
  { name: "Model card generator", short: "Reads an LLM app's config, observability data, and prompt history and auto-generates a structured model card.", category: "Data & ML", scope: "Project", personas: ["AI Engineer"], trigger: { type: "Manual", config: "Manual" }, toolPhrases: ["Read app config", "Read observability metrics", "Read prompt registry", "Write model card doc"] },
  // Agentic Engineer (8)
  { name: "Runaway execution detector", short: "Monitors running agent executions; when an agent exceeds its step or cost threshold, force-stops it, captures the trace, and files an incident.", category: "Observability", scope: "Org", personas: ["Agentic Engineer"], trigger: { type: "Threshold", config: "Step/cost threshold breach" }, toolPhrases: ["Read execution metrics", "Force-stop agent", "Write incident report", "Post alert"] },
  { name: "Tool permission auditor", short: "Scans all registered tools across deployed agents and flags any with a permission scope broader than the minimum required.", category: "Security", scope: "Org", personas: ["Agentic Engineer"], trigger: { type: "Schedule", config: "Weekly or manual" }, toolPhrases: ["Read tool registry", "Read agent configs", "Write audit report", "Create security ticket"] },
  { name: "Agent graph linter", short: "Checks an agent's graph against best practices (no unbounded loops, error handlers, checkpoints on writes, cost cap, rollback) at deploy time.", category: "Code & Testing", scope: "Project", personas: ["Agentic Engineer"], trigger: { type: "Event", config: "Agent deploy" }, toolPhrases: ["Read agent config", "Write lint report", "Block deployment if critical issues found"] },
  { name: "Execution trace summarizer", short: "Reads a completed or failed agent run's trace and produces a plain-English summary of what it did, why, and where it failed.", category: "Observability", scope: "Project", personas: ["Agentic Engineer"], trigger: { type: "Event", config: "Execution complete" }, toolPhrases: ["Read execution trace", "Write summary doc", "Post to linked incident or PR"] },
  { name: "Agent version comparator", short: "Diffs two versions of an agent — system prompt, tool list, safety config, execution outcomes — into a change impact report.", category: "Code & Testing", scope: "Project", personas: ["Agentic Engineer"], trigger: { type: "Manual", config: "Manual" }, toolPhrases: ["Read agent v1 config", "Read agent v2 config", "Read execution history", "Write comparison report"] },
  { name: "Safety boundary enforcer", short: "Monitors running agents against org safety policy; on a blocked action, interrupts execution, logs the violation, and notifies Security.", category: "Security", scope: "Org", personas: ["Agentic Engineer"], trigger: { type: "Continuous", config: "Real-time monitoring" }, toolPhrases: ["Read running agent actions", "Interrupt execution", "Write violation log", "Send notification"] },
  { name: "Human checkpoint reviewer helper", short: "When an agent pauses at a human checkpoint, pre-analyzes context and risk and writes a reviewer briefing to speed the decision.", category: "Observability", scope: "Project", personas: ["Agentic Engineer"], trigger: { type: "Event", config: "Human checkpoint reached" }, toolPhrases: ["Read execution trace so far", "Read agent config", "Read planned next action", "Write reviewer briefing"] },
  { name: "Memory hygiene cleaner", short: "Audits agent long-term memory for stale, redundant, or conflicting entries and executes a clean-up plan with human approval.", category: "Data & ML", scope: "Project", personas: ["Agentic Engineer"], trigger: { type: "Schedule", config: "Weekly or manual" }, toolPhrases: ["Read memory store", "Identify stale entries", "Write clean-up plan", "Execute with approval"] },
  // Data Scientist (7)
  { name: "Experiment auto-documenter", short: "At the end of a training run, reads config, metrics, and artifacts and writes a structured experiment note with hypothesis, result, and next steps.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Event", config: "Training job complete" }, toolPhrases: ["Read experiment run", "Read metrics", "Read artifacts", "Write experiment doc", "Post to forum"] },
  { name: "Dataset quality reporter", short: "Profiles a dataset (nulls, outliers, class imbalance, correlations, duplicates) and writes a data quality report with fix suggestions.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Event", config: "Manual or dataset publish" }, toolPhrases: ["Read dataset sample", "Compute quality stats", "Write quality report"] },
  { name: "Feature importance analyst", short: "Compares model feature-importance scores against the prior version and flags features that changed rank significantly.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Event", config: "Training job complete" }, toolPhrases: ["Read model artifacts", "Read prior version artifacts", "Write feature drift report"] },
  { name: "Model card auto-generator", short: "Generates a complete model card from training config, evaluation metrics, dataset lineage, and intended use case.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Event", config: "Model registry publish" }, toolPhrases: ["Read model config", "Read metrics", "Read dataset lineage", "Write model card doc"] },
  { name: "Evaluation benchmark runner", short: "Runs a model against a fixed benchmark on a schedule and posts results to performance history, flagging regressions vs baseline.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Schedule", config: "Schedule or manual" }, toolPhrases: ["Read benchmark dataset", "Call model endpoint", "Compute metrics", "Write benchmark report", "Post alert if regression"] },
  { name: "Hyperparameter suggestion agent", short: "Suggests the next hyperparameters to try from prior runs' performance trend, avoiding already-tested combinations.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Manual", config: "Manual" }, toolPhrases: ["Read experiment history", "Analyze metric trends", "Write hyperparameter suggestions", "Pre-fill training request form"] },
  { name: "Approval package preparer", short: "Assembles metrics, evaluation report, model card, and lineage into a structured approval package for the reviewer.", category: "Data & ML", scope: "Project", personas: ["Data Scientist"], trigger: { type: "Event", config: "Promote model" }, toolPhrases: ["Read model metrics", "Read model card", "Read lineage", "Read evaluation report", "Write approval package doc"] },
  // App / Platform Engineer (7)
  { name: "Score spec validator", short: "Validates a submitted Score spec against platform standards before allowing deployment to proceed.", category: "Infrastructure", scope: "Project", personas: [APE], trigger: { type: "Event", config: "Service deploy" }, toolPhrases: ["Read Score spec", "Validate against rule set", "Write validation report", "Block or approve deploy"] },
  { name: "Deployment rollback advisor", short: "On a failed health check, reads logs, config changes, and error patterns and produces a root-cause summary with a rollback or forward-fix plan.", category: "Infrastructure", scope: "Project", personas: [APE], trigger: { type: "Event", config: "Health check failed" }, toolPhrases: ["Read deployment logs", "Read config diff", "Read error patterns", "Write advisory"] },
  { name: "GitOps drift remediation agent", short: "Detects out-of-sync GitOps resources, diagnoses the drift cause, and auto-remediates or writes a remediation plan.", category: "Infrastructure", scope: "Project", personas: [APE], trigger: { type: "Event", config: "Sync error" }, toolPhrases: ["Read desired state", "Read live state", "Compute diff", "Auto-sync or write remediation plan"] },
  { name: "Resource right-sizer", short: "Analyzes CPU/memory usage vs requests/limits across services and recommends right-sized values with projected savings.", category: "Cost", scope: "Org", personas: [APE], trigger: { type: "Schedule", config: "Weekly" }, toolPhrases: ["Read resource metrics", "Read service configs", "Compute recommendations", "Write right-sizing report"] },
  { name: "Kong route auditor", short: "Audits all Kong gateway routes for auth, rate limiting, and healthy upstreams.", category: "Security", scope: "Org", personas: [APE], trigger: { type: "Schedule", config: "Schedule or manual" }, toolPhrases: ["Read Kong route config", "Check upstream health", "Write audit report", "Flag routes missing auth"] },
  { name: "Dependency impact analyzer", short: "On a dependency version change, finds downstream services, checks for breaking changes, and notifies owners with a ranked impact list.", category: "Infrastructure", scope: "Org", personas: [APE], trigger: { type: "Event", config: "Dependency version change" }, toolPhrases: ["Read service catalog", "Read dependency graph", "Read changelog", "Write impact report", "Send notifications"] },
  { name: "Environment parity checker", short: "Compares dev/staging/prod configuration for a service and flags divergences that could cause prod-only failures.", category: "Infrastructure", scope: "Project", personas: [APE], trigger: { type: "Event", config: "Manual or pre-deploy" }, toolPhrases: ["Read environment configs", "Compute diff", "Write parity report"] },
  // MLOps Engineer (6)
  { name: "Drift root cause analyst", short: "On a drift alert, correlates feature drift, pipeline runs, dataset changes, and traffic patterns to identify the cause and recommend action.", category: "Data & ML", scope: "Project", personas: ["MLOps Engineer"], trigger: { type: "Event", config: "Drift alert" }, toolPhrases: ["Read drift report", "Read pipeline runs", "Read dataset changes", "Read traffic data", "Write root cause analysis"] },
  { name: "Retraining trigger optimizer", short: "Analyzes retraining history and recommends threshold adjustments to reduce unnecessary retrains.", category: "Data & ML", scope: "Project", personas: ["MLOps Engineer"], trigger: { type: "Schedule", config: "Monthly or manual" }, toolPhrases: ["Read retraining history", "Read drift history", "Read training costs", "Write optimization report"] },
  { name: "Training pipeline health monitor", short: "Checks each training run for unusual duration, resource usage, data-quality failures, and metric anomalies and writes a health summary.", category: "Observability", scope: "Org", personas: ["MLOps Engineer"], trigger: { type: "Event", config: "Pipeline run complete" }, toolPhrases: ["Read pipeline run metadata", "Read quality results", "Read resource usage", "Write health summary"] },
  { name: "GPU utilisation optimizer", short: "Analyzes GPU allocation vs usage over 30 days and identifies over-provisioned jobs, idle time, and batching opportunities.", category: "Cost", scope: "Org", personas: ["MLOps Engineer"], trigger: { type: "Schedule", config: "Weekly" }, toolPhrases: ["Read GPU usage metrics", "Read job configs", "Compute utilisation stats", "Write optimization plan"] },
  { name: "Model serving health watchdog", short: "Monitors serving endpoints every 5 minutes; on degradation fires an alert and initiates a rollback recommendation.", category: "Observability", scope: "Org", personas: ["MLOps Engineer"], trigger: { type: "Continuous", config: "Every 5 minutes" }, toolPhrases: ["Read endpoint metrics", "Compare to baseline", "Write alert", "Recommend rollback or scaling"] },
  { name: "Pipeline failure post-mortem writer", short: "After a pipeline failure, assembles logs, config changes, data issues, and compute events into a structured post-mortem.", category: "Observability", scope: "Project", personas: ["MLOps Engineer"], trigger: { type: "Event", config: "Pipeline failed" }, toolPhrases: ["Read pipeline logs", "Read config change history", "Read compute events", "Write post-mortem doc"] },
  // Security / Compliance (7)
  { name: "Policy gap scanner", short: "Compares deployed resources across namespaces against active OPA policies and files a prioritized remediation list.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Schedule", config: "Daily or manual" }, toolPhrases: ["Read OPA policies", "Read cluster resources", "Compute coverage", "Write gap report"] },
  { name: "Access anomaly investigator", short: "On an access anomaly, reads audit-log context around the event and writes a structured investigation brief with risk assessment.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Event", config: "Access anomaly" }, toolPhrases: ["Read audit log", "Read user profile", "Read access history", "Write investigation brief"] },
  { name: "Compliance evidence collector", short: "Collects all required evidence for a framework (SOC2/ISO27001/GDPR) and packages it into an evidence bundle.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Manual", config: "Audit preparation" }, toolPhrases: ["Read audit logs", "Read policy configs", "Read access reviews", "Read incident records", "Write evidence bundle"] },
  { name: "Secret rotation reminder", short: "Scans secrets and API keys for expiry/age beyond policy and notifies owners with a rotation guide, tracking completion.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Schedule", config: "Daily" }, toolPhrases: ["Read secret metadata", "Compute age vs policy", "Write rotation notifications", "Track status"] },
  { name: "PII exposure scanner", short: "Scans datasets for unregistered PII columns and files a report for data-engineer review.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Schedule", config: "Weekly or dataset publish" }, toolPhrases: ["Read dataset schemas", "Sample dataset values", "Detect PII patterns", "Write exposure report", "Notify data engineer"] },
  { name: "Agent safety policy enforcer", short: "After an agent deploy, verifies tool permissions, max steps, cost cap, and HITL config against org safety policy and blocks non-compliant agents.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Event", config: "Agent deploy" }, toolPhrases: ["Read agent config", "Read org safety policy", "Compare and compute gaps", "Block or approve", "Write compliance report"] },
  { name: "Incident response orchestrator", short: "On a declared incident, gathers evidence, drafts a preliminary report, and assigns remediation tasks to the right personas.", category: "Security", scope: "Org", personas: [SEC], trigger: { type: "Event", config: "Incident created" }, toolPhrases: ["Read audit logs", "Read incident context", "Read resource state", "Write incident report", "Assign tasks", "Send notifications"] },
  // Data Engineer (7)
  { name: "Pipeline failure root cause analyst", short: "On a data-pipeline failure, correlates error logs, upstream data changes, schema diffs, and config edits into a root-cause analysis with a fix.", category: "Data & ML", scope: "Project", personas: ["Data Engineer"], trigger: { type: "Event", config: "Pipeline failed" }, toolPhrases: ["Read pipeline logs", "Read upstream data state", "Read schema history", "Write root cause analysis"] },
  { name: "Schema change impact analyzer", short: "On a schema change, finds downstream consumers (models, apps, feature groups, pipelines) and writes an impact report with a migration plan.", category: "Data & ML", scope: "Org", personas: ["Data Engineer"], trigger: { type: "Event", config: "Schema change" }, toolPhrases: ["Read lineage graph", "Read schema diff", "Read downstream consumers", "Write impact report", "Notify consumer owners"] },
  { name: "Data quality remediation advisor", short: "On a failed quality check, samples bad rows, traces them upstream, and writes a remediation plan with the probable source of corruption.", category: "Data & ML", scope: "Project", personas: ["Data Engineer"], trigger: { type: "Event", config: "Quality check failed" }, toolPhrases: ["Read quality check result", "Sample failed rows", "Trace upstream", "Write remediation plan"] },
  { name: "Lineage gap detector", short: "Scans the lineage graph for datasets, models, or endpoints with missing connections and files a gap report.", category: "Infrastructure", scope: "Org", personas: ["Data Engineer"], trigger: { type: "Schedule", config: "Weekly or manual" }, toolPhrases: ["Read lineage graph", "Identify orphan nodes", "Write gap report", "Notify dataset owners"] },
  { name: "Feature store freshness watchdog", short: "Monitors feature groups for update lag beyond schedule; triggers a refresh job and notifies on failure.", category: "Data & ML", scope: "Org", personas: ["Data Engineer"], trigger: { type: "Continuous", config: "Continuous schedule" }, toolPhrases: ["Read feature store metadata", "Compare to schedule", "Trigger refresh job", "Write alert"] },
  { name: "Dataset deprecation manager", short: "On a set deprecation date, notifies consumers with a migration guide, tracks progress, and blocks new registrations after the date.", category: "Infrastructure", scope: "Org", personas: ["Data Engineer"], trigger: { type: "Event", config: "Deprecation date set" }, toolPhrases: ["Read consumer list", "Read replacement dataset", "Write migration guide", "Send notifications", "Track migration status", "Enforce deprecation"] },
  { name: "Duplicate dataset detector", short: "Scans the catalog for datasets with overlapping schema, similar names, or identical source paths and writes a deduplication report.", category: "Data & ML", scope: "Org", personas: ["Data Engineer"], trigger: { type: "Schedule", config: "Monthly or manual" }, toolPhrases: ["Read dataset catalog", "Compare schemas and paths", "Write deduplication report"] },
];

// A few team-built custom agents (Custom tab)
const CUSTOM: Raw[] = [
  { name: "Nightly cost digest", short: "Summarizes yesterday's cloud + LLM spend by team and posts a digest to Slack.", category: "Cost", scope: "Team", personas: [APE, "AI Engineer"], trigger: { type: "Schedule", config: "Daily 07:00" }, toolPhrases: ["Read cost metrics", "Write digest", "Post to Slack"], tab: "custom", author: "Platform Team", status: "Active" },
  { name: "Release notes drafter", short: "Drafts release notes from merged PRs since the last tag and opens a docs PR.", category: "Collaboration", scope: "Project", personas: [APE], trigger: { type: "Event", config: "Tag created" }, toolPhrases: ["Read merged PRs", "Write release notes", "Create PR"], tab: "custom", author: "DevEx Guild", status: "Beta" },
  { name: "On-call handoff summarizer", short: "At shift change, summarizes open incidents, recent alerts, and risky deploys into a handoff brief.", category: "Observability", scope: "Team", personas: ["MLOps Engineer", SEC], trigger: { type: "Schedule", config: "Shift change" }, toolPhrases: ["Read incident list", "Read alert history", "Read recent deploys", "Write handoff brief"], tab: "custom", author: "SRE Team", status: "Active" },
];

// ---------------------------------------------------------------------------
// Expand raw → full Agent
// ---------------------------------------------------------------------------

function expand(r: Raw): Agent {
  const h = hash(r.name);
  const tools = r.toolPhrases.map(toolFromPhrase);
  const scope = r.scope;
  const trigger = r.trigger;
  return {
    id: slug(r.name),
    name: r.name,
    description_short: r.short,
    description_full: `${r.short} ${r.name} runs as a scoped worker agent within the IDP. It gathers the context it needs, reasons over it with an LLM backbone, and takes action through a small set of permitted tools — pausing for human review before any write when a checkpoint is configured. It is designed for the ${r.personas.join(", ")} workflow and operates at ${scope} scope.`,
    icon: r.category,
    category: r.category,
    scope,
    available_on: r.available_on ?? "Platform Team",
    version: "v1.0.0",
    personas: r.personas,
    tab: r.tab ?? "marketplace",
    author: r.author ?? "Platform Team",
    trigger,
    steps_explanation: deriveSteps(r.name, tools, trigger.type),
    prerequisites: [
      "Connected source system (repo, cluster, registry, or data platform)",
      "A pipeline or workspace the agent can be attached to",
      ...(tools.some((t) => t.permission_scope !== "Read-only") ? ["Write credentials scoped to the target"] : []),
    ],
    inputs: deriveInputs({ trigger, scope }),
    tools,
    safety: deriveSafety(r.name, tools, scope),
    status: r.status ?? (["Active", "Active", "Active", "Beta"][h % 4] as AgentStatus),
    use_count: 40 + (h % 4200),
    rating: +(3.8 + (h % 12) / 10).toFixed(1),
    created_at: daysAgo(10 + (h % 320)),
    updated_at: daysAgo(h % 20),
  };
}

const ALL: Agent[] = [...harnessRaw, ...NEW, ...CUSTOM].map(expand);

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export interface AgentFilters {
  tab?: "marketplace" | "custom";
  persona?: string; // display name or "all"
  category?: string;
  scope?: string;
  sort?: string;
  q?: string;
}

export async function getAgents(filters: AgentFilters = {}): Promise<Agent[]> {
  await delay();
  const { tab = "marketplace", persona = "all", category = "all", scope = "all", sort = "Most used", q = "" } = filters;
  const query = q.trim().toLowerCase();
  let rows = ALL.filter(
    (a) =>
      a.tab === tab &&
      (persona === "all" || a.personas.includes(persona)) &&
      (category === "all" || a.category === category) &&
      (scope === "all" || a.scope === scope) &&
      (!query || a.name.toLowerCase().includes(query) || a.description_short.toLowerCase().includes(query))
  );
  rows = [...rows].sort((a, b) => {
    if (sort === "A-Z") return a.name.localeCompare(b.name);
    if (sort === "Rating") return b.rating - a.rating;
    if (sort === "Newest") return b.created_at.localeCompare(a.created_at);
    return b.use_count - a.use_count; // Most used
  });
  return rows;
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  await delay(220);
  const a = ALL.find((x) => x.id === id);
  return a ? { ...a, executionsList: deriveExecutions(a.name) } as Agent & { executionsList: AgentExecution[] } : undefined;
}

/** Recent executions for the detail screen's Executions tab. */
export async function getAgentExecutions(id: string): Promise<AgentExecution[]> {
  await delay();
  const a = ALL.find((x) => x.id === id);
  return a ? deriveExecutions(a.name) : [];
}

export async function deployAgent(
  _id: string,
  _body: { pipeline_id?: string; environment?: string; input_overrides?: Record<string, string> }
): Promise<{ deployment_id: string }> {
  await delay(600);
  return { deployment_id: uid("adep") };
}

export interface ToolRegItem {
  id: string; name: string; description: string;
  permission_scope: PermissionScope; category: string; auth_type: string;
}

export async function getToolsRegistry(): Promise<ToolRegItem[]> {
  await delay(200);
  return [
    { id: "read_file", name: "Read file", description: "Reads source files from the repo", permission_scope: "Read-only", category: "Code", auth_type: "Connector" },
    { id: "write_file", name: "Write file", description: "Commits changes to a branch", permission_scope: "Write", category: "Code", auth_type: "Connector" },
    { id: "create_pr", name: "Create PR", description: "Opens a pull request on GitHub/GitLab", permission_scope: "Write", category: "Code", auth_type: "OAuth" },
    { id: "call_api", name: "Call API", description: "Calls named external endpoints", permission_scope: "Scoped", category: "Integration", auth_type: "API key" },
    { id: "query_db", name: "Query database", description: "Reads from specified tables", permission_scope: "Read-only", category: "Data", auth_type: "Secret" },
    { id: "exec_code", name: "Execute code", description: "Runs in an isolated container", permission_scope: "Sandboxed", category: "Compute", auth_type: "None" },
    { id: "read_metrics", name: "Read metrics", description: "Reads observability/cost metrics", permission_scope: "Read-only", category: "Observability", auth_type: "Connector" },
    { id: "post_message", name: "Post message", description: "Posts to Slack/Teams/forum", permission_scope: "Write", category: "Collaboration", auth_type: "OAuth" },
    { id: "write_report", name: "Write report", description: "Writes a report/doc artifact", permission_scope: "Write", category: "Docs", auth_type: "None" },
    { id: "create_ticket", name: "Create ticket", description: "Creates a Jira/ServiceNow ticket", permission_scope: "Write", category: "Ticketing", auth_type: "OAuth" },
  ];
}

export async function getLlmProviders(): Promise<{ id: string; name: string; models: string[] }[]> {
  await delay(180);
  return [
    { id: "anthropic", name: "Anthropic", models: ["claude-3.5-sonnet", "claude-3.5-haiku", "claude-3-opus"] },
    { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini"] },
    { id: "vertex", name: "Vertex AI", models: ["gemini-1.5-pro", "gemini-1.5-flash"] },
    { id: "self-hosted", name: "Self-hosted", models: ["llama-3.1-70b", "mixtral-8x7b"] },
  ];
}

export async function buildAgent(_body: unknown): Promise<{ agent_id: string; status: string }> {
  await delay(700);
  return { agent_id: uid("agent"), status: "draft" };
}

export async function sandboxTest(_body: unknown): Promise<{
  trace: { step: number; action: string; tool_called: string; result: string; cost: number }[];
  total_cost: number;
  outcome: string;
}> {
  await delay(900);
  const trace = [
    { step: 1, action: "Gather context", tool_called: "Read file", result: "Loaded 12 source files", cost: 0.004 },
    { step: 2, action: "Reason over inputs", tool_called: "—", result: "Identified 3 candidate changes", cost: 0.011 },
    { step: 3, action: "Apply change", tool_called: "Write file", result: "Wrote patch to feature branch", cost: 0.006 },
    { step: 4, action: "Verify", tool_called: "Execute code", result: "Tests passed (42/42)", cost: 0.009 },
  ];
  return { trace, total_cost: +trace.reduce((s, t) => s + t.cost, 0).toFixed(3), outcome: "Success" };
}
