import {
  getAgents,
  getRuns,
  getCheckpoints,
  getMetrics,
  getTools,
} from "../../personas/agentic-engineer/api";
import type { PersonaBuilderResult } from "./index";

/**
 * Agentic Engineer context — live from the agent runtime: agents, plan→act→
 * observe runs, HITL checkpoints, tools and autonomy budget.
 */
export async function buildAgenticEngineerContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "incident-response": {
      const [runs, agents] = await Promise.all([getRuns(), getAgents()]);
      const failed = runs.find((r) => r.status === "Failed") ?? runs[0];
      const degraded = agents.find((a) => a.status === "Degraded") ?? agents[0];
      return {
        seed: {
          incidentDesc: `Agent run failed — ${failed.agent_name}: "${failed.goal}" (halted after ${failed.steps} steps)`,
          affectedServices: `${failed.agent_name} runtime, ${degraded.name}`,
          errorRate: String(Math.round((1 - degraded.success_rate) * 100)),
        },
        highlights: `${runs.filter((r) => r.status === "Failed").length} failed runs; ${degraded.name} degraded at ${(degraded.success_rate * 100).toFixed(0)}% success. Failed run hit an autonomy-budget block.`,
      };
    }
    case "cost-optimization": {
      const [metrics, agents] = await Promise.all([getMetrics(), getAgents()]);
      const top = [...agents].sort((a, b) => b.cost_day - a.cost_day)[0];
      return {
        seed: {
          costCompute: `${top.name} — $${top.cost_day.toFixed(2)}/day, avg ${top.avg_steps} steps/run (top agent spend)`,
          costMonthly: String(Math.round(metrics.today_cost * 30)),
          costDb: `token spend across ${agents.length} agents; autonomy budget ${metrics.autonomy_budget_used}% used`,
        },
        highlights: `Today $${metrics.today_cost}, autonomy budget ${metrics.autonomy_budget_used}% used; top agent ${top.name} at $${top.cost_day}/day.`,
      };
    }
    case "security-posture": {
      const [tools, checkpoints] = await Promise.all([getTools(), getCheckpoints()]);
      const writeTools = tools.filter((t) => /write/.test(t.scope));
      const highRisk = checkpoints.filter((c) => c.risk === "High").length;
      return {
        seed: {
          cveCount: String(tools.length),
          criticalCves: String(writeTools.length),
          secretsFound: String(checkpoints.length),
          iacDrift: "false",
        },
        highlights: `${writeTools.length} write-scoped tools agents can call, ${checkpoints.length} pending HITL checkpoints (${highRisk} high-risk) — treat as autonomy/tool-permission risk, not CVEs.`,
      };
    }
    case "workflow-diagnostic": {
      const runs = await getRuns();
      const failed = runs.find((r) => r.status === "Failed") ?? runs[0];
      return {
        seed: {
          errorLog: `Agent run failed — ${failed.agent_name}
│ goal: ${failed.goal}
│ plan→act→observe halted at step ${failed.steps}
│ tool call blocked by autonomy policy (db:write beyond budget)
│ run cost $${failed.cost.toFixed(2)}, ${failed.tokens.toLocaleString()} tokens before failure`,
          wfRepository: `agents/${failed.agent_name}`,
          wfBranch: "main",
          wfTrigger: "autonomous run",
          wfEnvironment: "agent runtime",
          wfLastSuccess: "1 hour ago",
        },
        highlights: `${failed.agent_name} run failing at the plan→act→observe loop when a write tool exceeded the autonomy budget.`,
      };
    }
    case "release-readiness": {
      const agents = await getAgents();
      const a = agents.find((x) => x.status === "Awaiting approval") ?? agents[0];
      return {
        seed: {
          testCoverage: (a.success_rate * 100).toFixed(1),
          successRate: (a.success_rate * 100).toFixed(1),
          rollbackCount: "1",
        },
        highlights: `Promoting ${a.name} (${a.runtime}) — ${(a.success_rate * 100).toFixed(0)}% task success over sandbox eval, autonomy ${a.autonomy}. Treat "test coverage" as the eval pass rate.`,
      };
    }
    default:
      return {};
  }
}
