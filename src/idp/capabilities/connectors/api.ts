import { delay } from "../../api/client";

/**
 * IDP Connectors catalog — the connector types the platform can integrate with,
 * grouped by category. Persona-agnostic (same catalog for everyone). GCP and
 * SDLC connectors are flagged for highlighting.
 */

export type ConnectorStatus = "Connected" | "Available" | "Upgrade required";

export interface Connector {
  id: string;
  name: string;
  category: string;
  status: ConnectorStatus;
  gcp: boolean;
  sdlc: boolean;
}

/** Categories whose tools are part of the software delivery lifecycle. */
const SDLC_CATEGORIES = new Set([
  "Code Repositories",
  "Artifact Repositories",
  "Ticketing Systems",
]);

/** Ordered category → connector names (from the platform connector list). */
const RAW: Record<string, string[]> = {
  "Cloud Providers": [
    "AWS", "Azure", "GCP", "Kubernetes cluster", "Physical Data Center",
    "Rancher cluster", "Spot", "Tanzu Application Service", "Terraform Cloud",
  ],
  "Artifact Repositories": [
    "Bamboo", "Artifactory", "Azure Artifacts", "Docker Registry",
    "HTTP Helm Repo", "Jenkins", "Nexus", "OCI Helm Registry",
  ],
  "Cloud & AI Costs": [
    "AWS - Cloud Cost", "Azure - Cloud Cost", "GCP - Cloud Cost", "Kubernetes",
  ],
  "Code Repositories": ["Azure Repos", "Bitbucket", "Git", "GitHub", "GitLab"],
  "Ticketing Systems": ["Jira", "Jsm", "ServiceNow"],
  "Monitoring & Logging": [
    "ElasticSearch", "PagerDuty", "AppDynamics", "Custom Health", "Datadog",
    "Dynatrace", "Error Tracking", "New Relic", "Prometheus", "Splunk",
    "Splunk Observability [SignalFX]", "Sumo Logic",
  ],
  "Secret Managers": [
    "AWS KMS", "AWS Secrets Manager", "Azure Key Vault", "Custom Secrets Manager",
    "GCP KMS", "GCP Secrets Manager", "HashiCorp Vault",
  ],
  Database: ["JDBC"],
  "Communication Tools": ["Google Chat", "Microsoft Teams", "OpsGenie", "Slack", "Zoom"],
  Documentation: ["Confluence"],
  "AI Providers": ["Anthropic", "OpenAI"],
  "MCP Servers": ["Custom MCP Server"],
};

/** A realistic subset shown as already connected. */
const CONNECTED = new Set([
  "GCP", "GCP - Cloud Cost", "GitHub", "Jenkins", "Artifactory", "Docker Registry",
  "Jira", "ServiceNow", "Datadog", "Prometheus", "Slack", "Google Chat",
  "Confluence", "Anthropic", "OpenAI", "Terraform Cloud", "Kubernetes cluster",
]);

export const CONNECTOR_CATEGORY_ORDER = Object.keys(RAW);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const ALL: Connector[] = Object.entries(RAW).flatMap(([category, names]) =>
  names.map((name) => ({
    id: `${slug(category)}__${slug(name)}`,
    name,
    category,
    status: (category === "Secret Managers"
      ? "Upgrade required"
      : CONNECTED.has(name)
      ? "Connected"
      : "Available") as ConnectorStatus,
    gcp: /gcp/i.test(name),
    sdlc: SDLC_CATEGORIES.has(category),
  }))
);

export async function getConnectors(): Promise<Connector[]> {
  await delay();
  return ALL;
}

/** Counts for the header. */
export async function getConnectorSummary(): Promise<{
  total: number;
  connected: number;
  gcp: number;
  sdlc: number;
}> {
  await delay(180);
  return {
    total: ALL.length,
    connected: ALL.filter((c) => c.status === "Connected").length,
    gcp: ALL.filter((c) => c.gcp).length,
    sdlc: ALL.filter((c) => c.sdlc).length,
  };
}
