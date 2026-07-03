import { getComputeQuota, getTrainingJobs, getDatasets } from "../../personas/data-scientist/api";
import type { PersonaBuilderResult } from "./index";

/**
 * Data Scientist agent context, drawn live from training jobs, compute quota
 * and the dataset catalog.
 */
export async function buildDataScientistContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "cost-optimization": {
      const [quota, jobs] = await Promise.all([getComputeQuota(), getTrainingJobs()]);
      const running = jobs.filter((j) => j.status === "Running");
      const gpuHours = jobs.reduce((s, j) => s + j.runtime_min, 0) / 60;
      const longest = Math.max(...jobs.map((j) => j.runtime_min));
      return {
        seed: {
          costCompute: `GPU training cluster — ${running.length} active jobs, ${quota.available_gpus} GPUs free, queue depth ${quota.queue_depth}`,
          costMonthly: String(Math.round(gpuHours * 2.9 * 30)),
          costDb: `feature store + BigQuery scans across ${jobs.length} training datasets`,
        },
        highlights: `${running.length} jobs running, ${quota.available_gpus} GPUs free, ${quota.queue_depth} queued; longest job ${longest}min.`,
      };
    }
    case "security-posture": {
      const datasets = await getDatasets();
      const restricted = datasets.filter((d) => d.access_level !== "Open");
      const confidential = datasets.filter((d) => d.access_level === "Confidential");
      return {
        seed: {
          cveCount: String(datasets.length),
          criticalCves: String(confidential.length),
          secretsFound: String(restricted.length),
          iacDrift: "false",
        },
        highlights: `${datasets.length} datasets in scope; ${confidential.length} confidential, ${restricted.length} restricted/PII — treat findings as data-access/PII risks, not CVEs.`,
      };
    }
    default:
      return {};
  }
}
