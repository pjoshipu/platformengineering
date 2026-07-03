import {
  getSecurityMetrics,
  getViolations,
  getCostMetrics,
} from "../../personas/security/api";
import type { PersonaBuilderResult } from "./index";

/**
 * Security & Compliance context — live from violations, security metrics and
 * cost attribution.
 */
export async function buildSecurityContext(agentId: string): Promise<PersonaBuilderResult> {
  switch (agentId) {
    case "security-posture": {
      const [m, viol] = await Promise.all([getSecurityMetrics(), getViolations()]);
      const crit = viol.filter((v) => v.severity === "Critical").length;
      const access = viol.filter((v) => v.type === "Access").length;
      return {
        seed: {
          cveCount: String(viol.length),
          criticalCves: String(crit),
          secretsFound: String(access),
          iacDrift: "true",
        },
        highlights: `${m.violations_today} violations today, ${m.guardrail_incidents} guardrail incidents, ${m.access_anomalies} access anomalies across ${m.active_policies} active policies.`,
      };
    }
    case "incident-response": {
      const viol = await getViolations();
      const v = viol.find((x) => x.severity === "Critical") ?? viol[0];
      const related = viol
        .filter((x) => x.type === v.type)
        .map((x) => x.resource)
        .slice(0, 3);
      return {
        seed: {
          incidentDesc: `Security incident — ${v.action} on ${v.resource}`,
          affectedServices: related.join(", ") || v.resource,
          errorRate: "5",
        },
        highlights: `Top: ${v.severity} ${v.type} — ${v.action} (${v.resource}). Frame as a security incident, not a service outage.`,
      };
    }
    case "cost-optimization": {
      const c = await getCostMetrics();
      return {
        seed: {
          costCompute: `Top team "${c.top_team}" spend — chargeback view`,
          costMonthly: String(c.total_spend_mtd),
          costDb: `Untagged spend $${c.untagged_spend} (needs attribution)`,
        },
        highlights: `MTD $${c.total_spend_mtd}, projected $${c.projected_month}, untagged $${c.untagged_spend} — focus on cost governance/attribution.`,
      };
    }
    default:
      return {};
  }
}
