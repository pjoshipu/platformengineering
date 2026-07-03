import { getServices, getInfraResources } from "../../personas/app-engineer/api";
import type { PersonaBuilderResult } from "./index";

/**
 * App / Platform Engineer context — the baseline persona. Live from services
 * and infrastructure; leaves the more generic agents (release/security/flags)
 * on their defaults so this persona reads as the platform baseline.
 */
export async function buildAppEngineerContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "workflow-diagnostic": {
      const services = await getServices();
      const bad =
        services.find((s) => s.sync_status === "Out of sync") ??
        services.find((s) => s.health !== "Healthy") ??
        services[0];
      const unsynced = services.filter((s) => s.sync_status !== "Synced").length;
      return {
        seed: {
          errorLog: `GitOps sync failed for ${bad.name} (${bad.env})
│ desired replicas 3, live 2 — image ${bad.version} drift
│ health: ${bad.health}, sync: ${bad.sync_status}
│ readiness probe failing on new pods`,
          wfRepository: "platform/gitops",
          wfBranch: "main",
          wfTrigger: "ArgoCD auto-sync",
          wfEnvironment: bad.env,
          wfLastSuccess: "12 hours ago",
        },
        highlights: `${bad.name} out of sync in ${bad.env} (health ${bad.health}); ${unsynced} apps not synced.`,
      };
    }
    case "incident-response": {
      const services = await getServices();
      const unhealthy = services.filter((s) => s.health !== "Healthy");
      const bad = unhealthy.find((s) => s.health === "Degraded") ?? unhealthy[0] ?? services[0];
      return {
        seed: {
          incidentDesc: `${bad.name} ${bad.health.toLowerCase()} — elevated 5xx after deploy ${bad.version}`,
          affectedServices: unhealthy.map((s) => s.name).join(", ") || bad.name,
          errorRate: "38",
        },
        highlights: `${unhealthy.length} services not healthy; ${bad.name} (${bad.env}) worst affected.`,
      };
    }
    case "cost-optimization": {
      const resources = await getInfraResources();
      const failed = resources.filter((r) => r.status === "Failed");
      const redis = resources.find((r) => /redis/i.test(r.type));
      const pg = resources.find((r) => /postgres/i.test(r.type));
      return {
        seed: {
          costCompute: `${resources[0].type} ${resources[0].name} (${resources[0].provider})`,
          costMonthly: String(resources.length * 320 + 900),
          costDb: `${pg?.name ?? "checkout-postgres"} + ${redis?.name ?? "orders-redis"}`,
        },
        highlights: `${resources.length} managed resources; ${failed.length} failed${failed[0] ? ` (${failed[0].name})` : ""}.`,
      };
    }
    default:
      return {};
  }
}
