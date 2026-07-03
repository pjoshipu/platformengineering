import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Mock API for the Agentic Engineer persona — building and operating autonomous
 * agents: an agent runtime/registry, plan→act→observe run traces, human-in-the-
 * loop (HITL) checkpoints, an autonomy budget, and a tool registry. All GET
 * endpoints return realistic dummy data; writes return plausible ids/status.
 */

export type AgentStatus = "Healthy" | "Degraded" | "Paused" | "Awaiting approval";
export type Autonomy = "Low" | "Medium" | "High";

export interface Agent {
  id: string;
  name: string;
  goal: string;
  runtime: string;
  model: string;
  tools: number;
  status: AgentStatus;
  autonomy: Autonomy;
  success_rate: number; // 0–1
  cost_day: number; // $
  avg_steps: number;
}

export type RunStatus = "Running" | "Completed" | "Failed" | "Awaiting approval" | "Halted";

export interface AgentRun {
  id: string;
  agent_id: string;
  agent_name: string;
  goal: string;
  status: RunStatus;
  steps: number;
  started_at: string;
  duration: string;
  cost: number;
  tokens: number;
}

export interface RunStep {
  idx: number;
  phase: "plan" | "act" | "observe";
  summary: string;
  tool?: string;
  status: "ok" | "blocked" | "error" | "waiting";
}

export interface Checkpoint {
  id: string;
  run_id: string;
  agent_name: string;
  action: string;
  risk: "Low" | "Medium" | "High";
  requested_at: string;
}

export type ToolType = "API" | "MCP" | "Function" | "Retrieval";

export interface Tool {
  id: string;
  name: string;
  type: ToolType;
  scope: string;
  calls_24h: number;
  enabled: boolean;
}

export interface AgenticMetrics {
  total_agents: number;
  active_runs: number;
  pending_checkpoints: number;
  autonomy_budget_used: number; // %
  today_cost: number;
}

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

const AGENTS: Agent[] = [
  { id: "ag_1", name: "support-triage-agent", goal: "Triage inbound support tickets and draft responses", runtime: "Claude Agent SDK", model: "claude-3.5-sonnet", tools: 5, status: "Healthy", autonomy: "Medium", success_rate: 0.93, cost_day: 34.2, avg_steps: 7 },
  { id: "ag_2", name: "infra-remediation-agent", goal: "Auto-remediate paging alerts within policy", runtime: "LangGraph", model: "gpt-4o", tools: 8, status: "Awaiting approval", autonomy: "Low", success_rate: 0.88, cost_day: 51.7, avg_steps: 12 },
  { id: "ag_3", name: "data-pipeline-agent", goal: "Diagnose and retry failed data pipelines", runtime: "Claude Agent SDK", model: "claude-3.5-sonnet", tools: 6, status: "Degraded", autonomy: "Medium", success_rate: 0.71, cost_day: 22.4, avg_steps: 9 },
  { id: "ag_4", name: "release-captain", goal: "Coordinate multi-service releases end to end", runtime: "Custom (LangChain)", model: "gpt-4o", tools: 10, status: "Paused", autonomy: "High", success_rate: 0.9, cost_day: 40.0, avg_steps: 15 },
  { id: "ag_5", name: "docs-writer-agent", goal: "Keep runbooks and docs current from PRs", runtime: "Claude Agent SDK", model: "claude-3.5-haiku", tools: 3, status: "Healthy", autonomy: "Low", success_rate: 0.96, cost_day: 8.5, avg_steps: 4 },
];

const RUNS: AgentRun[] = [
  { id: "run_1", agent_id: "ag_1", agent_name: "support-triage-agent", goal: "Triage ticket #48213 — refund not received", status: "Completed", steps: 7, started_at: minutesAgo(12), duration: "2m 14s", cost: 0.12, tokens: 18400 },
  { id: "run_2", agent_id: "ag_2", agent_name: "infra-remediation-agent", goal: "Remediate P2 — payments pod crashloop", status: "Awaiting approval", steps: 5, started_at: minutesAgo(6), duration: "1m 02s", cost: 0.08, tokens: 12100 },
  { id: "run_3", agent_id: "ag_3", agent_name: "data-pipeline-agent", goal: "Retry failed pipeline payments_reconcile", status: "Failed", steps: 9, started_at: hoursAgo(1), duration: "3m 41s", cost: 0.21, tokens: 31200 },
  { id: "run_4", agent_id: "ag_4", agent_name: "release-captain", goal: "Release checkout-api v2.9 across 3 services", status: "Running", steps: 11, started_at: minutesAgo(3), duration: "4m 08s", cost: 0.34, tokens: 47800 },
  { id: "run_5", agent_id: "ag_1", agent_name: "support-triage-agent", goal: "Triage ticket #48219 — login loop", status: "Halted", steps: 4, started_at: hoursAgo(3), duration: "0m 48s", cost: 0.05, tokens: 7300 },
];

const STEPS_BY_RUN: Record<string, RunStep[]> = {
  run_3: [
    { idx: 1, phase: "plan", summary: "Goal: retry payments_reconcile. Plan: fetch failure logs → identify cause → retry with fix", status: "ok" },
    { idx: 2, phase: "act", summary: "Fetched Airflow task logs for payments_reconcile", tool: "airflow.get_logs", status: "ok" },
    { idx: 3, phase: "observe", summary: "Cause: dbt test amount_not_null failed — 1,420 null rows upstream", status: "ok" },
    { idx: 4, phase: "plan", summary: "Decide: backfill upstream then retry; requires warehouse write", status: "ok" },
    { idx: 5, phase: "act", summary: "Requested backfill of orders_daily", tool: "warehouse.backfill", status: "blocked" },
    { idx: 6, phase: "observe", summary: "Tool blocked by autonomy policy (db:write beyond budget)", status: "error" },
    { idx: 7, phase: "plan", summary: "Re-plan: escalate to human with proposed fix", status: "ok" },
    { idx: 8, phase: "act", summary: "Opened checkpoint for approval", tool: "hitl.request", status: "waiting" },
    { idx: 9, phase: "observe", summary: "Run failed: budget exhausted before approval granted", status: "error" },
  ],
  run_4: [
    { idx: 1, phase: "plan", summary: "Plan release order: user-profile → checkout-api → payments-gateway", status: "ok" },
    { idx: 2, phase: "act", summary: "Ran pre-release checks on user-profile", tool: "ci.run_checks", status: "ok" },
    { idx: 3, phase: "observe", summary: "All gates green for user-profile v2.9", status: "ok" },
    { idx: 4, phase: "act", summary: "Promoted user-profile to prod", tool: "argocd.promote", status: "ok" },
    { idx: 5, phase: "plan", summary: "Next: checkout-api — requires prod promote approval", status: "ok" },
    { idx: 6, phase: "act", summary: "Requested approval to promote checkout-api", tool: "hitl.request", status: "waiting" },
  ],
};

const CHECKPOINTS: Checkpoint[] = [
  { id: "cp_1", run_id: "run_2", agent_name: "infra-remediation-agent", action: "Restart prod payments pods (kubectl rollout restart)", risk: "High", requested_at: minutesAgo(6) },
  { id: "cp_2", run_id: "run_4", agent_name: "release-captain", action: "Promote checkout-api v2.9 to prod", risk: "Medium", requested_at: minutesAgo(3) },
];

const TOOLS: Tool[] = [
  { id: "tl_1", name: "github.create_pr", type: "API", scope: "repo:write", calls_24h: 42, enabled: true },
  { id: "tl_2", name: "k8s.rollout_restart", type: "API", scope: "cluster:write", calls_24h: 8, enabled: true },
  { id: "tl_3", name: "servicenow.create_incident", type: "MCP", scope: "itsm:write", calls_24h: 15, enabled: true },
  { id: "tl_4", name: "vector.search_kb", type: "Retrieval", scope: "kb:read", calls_24h: 320, enabled: true },
  { id: "tl_5", name: "slack.post_message", type: "API", scope: "chat:write", calls_24h: 88, enabled: true },
  { id: "tl_6", name: "prod.exec_sql", type: "Function", scope: "db:write", calls_24h: 2, enabled: false },
];

const RUNTIMES = ["Claude Agent SDK", "LangGraph", "Custom (LangChain)", "CrewAI"];

// ---------------------------------------------------------------------------
// GET endpoints
// ---------------------------------------------------------------------------

export async function getAgents(): Promise<Agent[]> {
  await delay();
  return AGENTS;
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  await delay(200);
  return AGENTS.find((a) => a.id === id);
}

export async function getMetrics(): Promise<AgenticMetrics> {
  await delay(260);
  return {
    total_agents: AGENTS.length,
    active_runs: RUNS.filter((r) => r.status === "Running").length + 1,
    pending_checkpoints: CHECKPOINTS.length,
    autonomy_budget_used: 62,
    today_cost: 156.8,
  };
}

export async function getRuns(): Promise<AgentRun[]> {
  await delay();
  return RUNS;
}

export async function getRun(id: string): Promise<{ run: AgentRun | undefined; steps: RunStep[] }> {
  await delay();
  return { run: RUNS.find((r) => r.id === id), steps: STEPS_BY_RUN[id] ?? STEPS_BY_RUN.run_3 };
}

export async function getCheckpoints(): Promise<Checkpoint[]> {
  await delay(240);
  return CHECKPOINTS;
}

export async function decideCheckpoint(
  _id: string,
  decision: "Approved" | "Rejected"
): Promise<{ status: string }> {
  await delay(400);
  return { status: decision };
}

export async function getTools(): Promise<Tool[]> {
  await delay();
  return TOOLS;
}

export async function toggleTool(_id: string, _enabled: boolean): Promise<{ status: string }> {
  await delay(300);
  return { status: "ok" };
}

export async function getRuntimes(): Promise<string[]> {
  await delay(150);
  return RUNTIMES;
}

export async function getAvailableTools(): Promise<Tool[]> {
  await delay(200);
  return TOOLS;
}

export async function deployAgent(_body: unknown): Promise<{ deployment_id: string }> {
  await delay(700);
  return { deployment_id: uid("adep") };
}

export interface DeployStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  log: string;
}

export async function getAgentDeployStatus(_id: string): Promise<{ steps: DeployStep[] }> {
  await delay(500);
  return {
    steps: [
      { name: "Register agent in runtime", status: "success", log: "agent registered (v0.1.0)" },
      { name: "Bind tools & check scopes", status: "success", log: "5 tools bound, scopes validated" },
      { name: "Apply autonomy budget & HITL policy", status: "success", log: "max 15 steps, $2/run, approval before prod writes" },
      { name: "Sandbox eval (20 scenarios)", status: "running", log: "running plan→act→observe eval…" },
      { name: "Promote to shadow traffic", status: "pending", log: "" },
      { name: "Agent live", status: "pending", log: "" },
    ],
  };
}

/** Recent versions for the registry detail drawer. */
export async function getAgentVersions(id: string) {
  await delay();
  const a = AGENTS.find((x) => x.id === id);
  return [
    { version: "v1.3.0", deployed_by: "k.nakamura", date: daysAgo(1), status: "Active", success_rate: a?.success_rate ?? 0.9 },
    { version: "v1.2.1", deployed_by: "k.nakamura", date: daysAgo(6), status: "Rolled back", success_rate: 0.79 },
    { version: "v1.2.0", deployed_by: "a.mehta", date: daysAgo(9), status: "Archived", success_rate: 0.82 },
  ];
}
