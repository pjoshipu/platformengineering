import { getPipelines, getQualityAlerts } from "../../personas/data-engineer/api";
import type { PersonaBuilderResult } from "./index";

/**
 * Data Engineer context — live from data pipelines and data-quality alerts.
 */
export async function buildDataEngineerContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "workflow-diagnostic": {
      const pipelines = await getPipelines();
      const failed = pipelines.find((p) => p.status === "Failed") ?? pipelines[0];
      const failedCount = pipelines.filter((p) => p.status === "Failed").length;
      return {
        seed: {
          errorLog: `dbt/Airflow pipeline "${failed.name}" failed
│ task: build ${failed.output_dataset}
│ dbt test amount_not_null FAILED — null rows detected
│ quality score dropped to ${failed.quality_score}`,
          wfRepository: "data-platform/dbt",
          wfBranch: "main",
          wfTrigger: `schedule ${failed.schedule}`,
          wfEnvironment: "warehouse",
          wfLastSuccess: "1 day ago",
        },
        highlights: `${failedCount} failed pipelines; ${failed.name} → ${failed.output_dataset} at quality ${failed.quality_score}.`,
      };
    }
    case "cost-optimization": {
      const pipelines = await getPipelines();
      const heavy = [...pipelines].sort((a, b) => b.duration_min - a.duration_min)[0];
      return {
        seed: {
          costCompute: `BigQuery warehouse — heaviest job "${heavy.name}" ${heavy.duration_min}min/run`,
          costMonthly: "9200",
          costDb: `${pipelines.length} scheduled pipelines scanning the warehouse`,
        },
        highlights: `Heaviest pipeline ${heavy.name} at ${heavy.duration_min}min; ${pipelines.length} scheduled jobs — focus on warehouse compute/scan cost.`,
      };
    }
    case "security-posture": {
      const alerts = await getQualityAlerts();
      const crit = alerts.filter((a) => a.severity === "critical").length;
      const pii = alerts.filter((a) => /email|pii|ssn/i.test(a.check_name)).length;
      return {
        seed: {
          cveCount: String(alerts.length),
          criticalCves: String(crit),
          secretsFound: String(pii),
          iacDrift: "false",
        },
        highlights: `${alerts.length} data-quality/PII alerts; ${crit} critical (${alerts[0]?.dataset_id}) — treat as data governance/PII risks.`,
      };
    }
    default:
      return {};
  }
}
