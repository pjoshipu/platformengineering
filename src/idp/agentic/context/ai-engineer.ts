import {
  getApps,
  getIncidents,
  getCostSummary,
  getCostByApp,
  getGuardrailIncidents,
} from "../../personas/ai-engineer/api";
import type { PersonaBuilderResult } from "./index";

/**
 * AI Engineer agent context, drawn live from the AI Engineer dashboards
 * (LLM apps, incidents, cost, guardrails).
 */
export async function buildAiEngineerContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "incident-response": {
      const [incidents, apps] = await Promise.all([getIncidents(), getApps()]);
      const inc = incidents[0];
      const degraded = apps.find((a) => a.status === "Degraded") ?? apps[0];
      return {
        seed: {
          incidentDesc: inc.title,
          affectedServices: `${inc.app_name}, model-gateway (${degraded.model})`,
          errorRate: String(Math.round((1 - degraded.faithfulness) * 100)),
        },
        highlights: `${incidents.length} open incidents (top: ${inc.severity} "${inc.title}"); ${degraded.name} degraded at faithfulness ${degraded.faithfulness}.`,
      };
    }
    case "cost-optimization": {
      const [cost, byApp] = await Promise.all([getCostSummary(), getCostByApp()]);
      const top = byApp[0];
      const embedder = byApp.find((a) => /embed/.test(a.name));
      return {
        seed: {
          costCompute: `${top.name} LLM inference — $${top.value}/day (top spend)`,
          costMonthly: String(Math.round(cost.mtd)),
          costDb: `vector store + embeddings (${embedder?.name ?? "kb-embedder"})`,
        },
        highlights: `Today $${cost.today}, MTD $${cost.mtd}, projected $${cost.projected}; top app ${top.name} at $${top.value}/day.`,
      };
    }
    case "security-posture": {
      const incidents = await getGuardrailIncidents("app_3");
      const blocks = incidents.filter((i) => /block/i.test(i.action)).length;
      const pii = incidents.filter((i) => /pii|redact|email|ssn/i.test(`${i.guardrail_type} ${i.action}`)).length;
      return {
        seed: {
          cveCount: String(incidents.length),
          criticalCves: String(blocks),
          secretsFound: String(pii),
          iacDrift: "false",
        },
        highlights: `${incidents.length} guardrail incidents in 24h (${blocks} blocked, ${pii} PII redactions) — LLM-layer security signals rather than CVEs.`,
      };
    }
    case "release-readiness": {
      const apps = await getApps();
      const app = apps.find((a) => a.status === "Canary") ?? apps[0];
      return {
        seed: {
          testCoverage: (app.faithfulness * 100).toFixed(1),
          avgResponseTime: String(Math.round(app.p95_latency * 0.6)),
          p95ResponseTime: String(app.p95_latency),
          p99ResponseTime: String(Math.round(app.p95_latency * 1.4)),
        },
        highlights: `Evaluating ${app.name} ${app.version} for promotion — faithfulness ${app.faithfulness}, p95 ${app.p95_latency}ms. Treat "test coverage" as the eval pass rate.`,
      };
    }
    case "workflow-diagnostic": {
      const apps = await getApps();
      const degraded = apps.find((a) => a.status === "Degraded") ?? apps[0];
      return {
        seed: {
          errorLog: `Error: LLM app deploy failed for ${degraded.name}
│ model-gateway route ${degraded.model} returned 429 (rate limit)
│ faithfulness eval gate FAILED: ${degraded.faithfulness} < 0.80 threshold
│ pipeline aborted before canary promotion`,
          wfRepository: `ai-apps/${degraded.name}`,
          wfBranch: "main",
          wfTrigger: "prompt version bump",
          wfEnvironment: "staging → prod (canary)",
          wfLastSuccess: "6 hours ago",
        },
        highlights: `Deploy pipeline for ${degraded.name} failing at the faithfulness gate.`,
      };
    }
    default:
      return {};
  }
}
