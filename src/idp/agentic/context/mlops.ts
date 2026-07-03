import {
  getPipelines,
  getDriftAlerts,
  getInfraMetrics,
  getInfraNodes,
  getMetrics,
} from "../../personas/mlops/api";
import type { PersonaBuilderResult } from "./index";

/**
 * MLOps Engineer context — live from training pipelines, drift alerts and the
 * GPU/serving fleet.
 */
export async function buildMlopsContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "workflow-diagnostic": {
      const pipelines = await getPipelines();
      const failed = pipelines.find((p) => p.status === "Failed") ?? pipelines[0];
      const failedCount = pipelines.filter((p) => p.status === "Failed").length;
      return {
        seed: {
          errorLog: `Training pipeline "${failed.name}" failed
│ step: model training on GPU (${failed.model_name})
│ CUDA out of memory on gpu-a100-02 (batch=512)
│ ran ${failed.duration_min}min before OOM; drift status ${failed.drift_status}`,
          wfRepository: "ml-platform/pipelines",
          wfBranch: "main",
          wfTrigger: failed.drift_status === "No drift" ? "scheduled run" : "drift auto-retrain",
          wfEnvironment: "training",
          wfLastSuccess: "1 day ago",
        },
        highlights: `${failedCount} failed pipelines; ${failed.name} OOM on GPU.`,
      };
    }
    case "incident-response": {
      const alerts = await getDriftAlerts();
      const a = alerts[0];
      return {
        seed: {
          incidentDesc: `Critical model drift on ${a.model_name} — feature ${a.feature} drift score ${a.drift_score}`,
          affectedServices: `${a.model_name} serving endpoint, retraining pipeline`,
          errorRate: String(Math.round(a.drift_score * 100)),
        },
        highlights: `${alerts.length} active drift alerts; worst ${a.model_name}/${a.feature} at ${a.drift_score}.`,
      };
    }
    case "cost-optimization": {
      const [m, nodes] = await Promise.all([getInfraMetrics(), getInfraNodes()]);
      const gpuNodes = nodes.filter((n) => n.type === "GPU node");
      const idle = nodes.filter((n) => n.utilisation < 10);
      const serving = nodes.filter((n) => n.type === "Serving endpoint");
      return {
        seed: {
          costCompute: `${gpuNodes.length} GPU nodes, fleet ${m.gpu_utilisation}% util — ${idle.length} idle (${idle[0]?.name ?? "none"})`,
          costMonthly: "24800",
          costDb: `${serving.length} serving endpoints, ${m.queue_depth} jobs queued`,
        },
        highlights: `GPU util ${m.gpu_utilisation}%, ${idle.length} idle node(s) wasting spend.`,
      };
    }
    case "release-readiness": {
      const m = await getMetrics();
      return {
        seed: {
          successRate: ((m.healthy_pipelines / m.total_pipelines) * 100).toFixed(1),
          rollbackCount: "1",
        },
        highlights: `${m.healthy_pipelines}/${m.total_pipelines} pipelines healthy; ${m.drift_alerts} drift alerts open.`,
      };
    }
    default:
      return {};
  }
}
