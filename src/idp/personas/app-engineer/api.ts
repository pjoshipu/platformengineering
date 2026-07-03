import { delay, uid, hoursAgo, daysAgo, minutesAgo } from "../../api/client";

/**
 * Mock API for the App / Platform Engineer persona. All GET endpoints return
 * realistic dummy data; write endpoints return plausible ids/status so screens
 * are fully interactive without a backend.
 */

export interface Service {
  id: string;
  name: string;
  env: string;
  version: string;
  sync_status: "Synced" | "Out of sync" | "Unknown";
  health: "Healthy" | "Degraded" | "Progressing" | "Missing";
  last_deployed: string;
}

export interface GitOpsApp {
  name: string;
  namespace: string;
  sync_status: "Synced" | "Out of sync" | "Unknown";
  health: "Healthy" | "Degraded" | "Progressing" | "Missing";
  last_sync: string;
  commit_sha: string;
}

export interface InfraResource {
  name: string;
  type: string;
  provider: string;
  status: "Ready" | "Creating" | "Deleting" | "Failed";
  namespace: string;
  claimed_by: string;
  age: string;
}

export interface AppMetrics {
  services: number;
  sync_errors: number;
  active_deployments: number;
  infra_drift: number;
}

const SERVICES: Service[] = [
  { id: "svc_1", name: "checkout-api", env: "prod", version: "v2.8.1", sync_status: "Synced", health: "Healthy", last_deployed: hoursAgo(5) },
  { id: "svc_2", name: "payments-gateway", env: "prod", version: "v4.1.0", sync_status: "Synced", health: "Healthy", last_deployed: daysAgo(1) },
  { id: "svc_3", name: "inventory-svc", env: "staging", version: "v1.12.3", sync_status: "Out of sync", health: "Degraded", last_deployed: hoursAgo(2) },
  { id: "svc_4", name: "notifications", env: "prod", version: "v3.0.4", sync_status: "Synced", health: "Progressing", last_deployed: minutesAgo(18) },
  { id: "svc_5", name: "search-api", env: "dev", version: "v0.9.7", sync_status: "Unknown", health: "Missing", last_deployed: daysAgo(4) },
  { id: "svc_6", name: "user-profile-svc", env: "prod", version: "v5.2.0", sync_status: "Synced", health: "Healthy", last_deployed: daysAgo(2) },
];

const GITOPS_APPS: GitOpsApp[] = [
  { name: "checkout-api", namespace: "prod", sync_status: "Synced", health: "Healthy", last_sync: minutesAgo(12), commit_sha: "a1b2c3d" },
  { name: "inventory-svc", namespace: "staging", sync_status: "Out of sync", health: "Degraded", last_sync: hoursAgo(3), commit_sha: "e4f5a6b" },
  { name: "notifications", namespace: "prod", sync_status: "Synced", health: "Progressing", last_sync: minutesAgo(4), commit_sha: "c7d8e9f" },
  { name: "search-api", namespace: "dev", sync_status: "Unknown", health: "Missing", last_sync: daysAgo(4), commit_sha: "0a1b2c3" },
  { name: "user-profile-svc", namespace: "prod", sync_status: "Synced", health: "Healthy", last_sync: hoursAgo(1), commit_sha: "3d4e5f6" },
];

const INFRA_RESOURCES: InfraResource[] = [
  { name: "checkout-postgres", type: "PostgresInstance", provider: "GCP", status: "Ready", namespace: "prod", claimed_by: "checkout-api", age: "34d" },
  { name: "orders-redis", type: "RedisCluster", provider: "GCP", status: "Ready", namespace: "prod", claimed_by: "payments-gateway", age: "21d" },
  { name: "events-topic", type: "PubSubTopic", provider: "GCP", status: "Creating", namespace: "staging", claimed_by: "inventory-svc", age: "3m" },
  { name: "assets-bucket", type: "StorageBucket", provider: "GCP", status: "Ready", namespace: "prod", claimed_by: "user-profile-svc", age: "58d" },
  { name: "legacy-cache", type: "RedisCluster", provider: "AWS", status: "Failed", namespace: "dev", claimed_by: "search-api", age: "2d" },
];

const GATEWAY_ROUTES = [
  { id: uid("rt"), path: "/api/checkout", service: "checkout-api", auth: "JWT", rate_limit: 600, status: "Active" },
  { id: uid("rt"), path: "/api/payments", service: "payments-gateway", auth: "OAuth2", rate_limit: 300, status: "Active" },
  { id: uid("rt"), path: "/api/search", service: "search-api", auth: "API key", rate_limit: 1200, status: "Disabled" },
  { id: uid("rt"), path: "/api/notify", service: "notifications", auth: "None", rate_limit: 0, status: "Active" },
];

const SCORE_TEMPLATE = `apiVersion: score.dev/v1b1
metadata:
  name: my-service
containers:
  main:
    image: registry.internal/my-service:latest
    variables:
      LOG_LEVEL: info
    resources:
      requests: { cpu: "250m", memory: "256Mi" }
      limits:   { cpu: "500m", memory: "512Mi" }
resources:
  db:
    type: postgres
service:
  ports:
    http: { port: 8080 }
`;

export async function getServices(): Promise<Service[]> {
  await delay();
  return SERVICES;
}

export async function getMetrics(): Promise<AppMetrics> {
  await delay(260);
  return { services: SERVICES.length, sync_errors: 1, active_deployments: 2, infra_drift: 1 };
}

export async function getGitOpsApps(): Promise<GitOpsApp[]> {
  await delay();
  return GITOPS_APPS;
}

export async function getGitOpsDiff(name: string): Promise<{
  desired_yaml: string;
  live_yaml: string;
}> {
  await delay();
  return {
    desired_yaml: `# desired (git) — ${name}\nreplicas: 3\nimage: registry.internal/${name}:v1.12.4\nresources:\n  limits:\n    cpu: 500m\n    memory: 512Mi`,
    live_yaml: `# live (cluster) — ${name}\nreplicas: 2\nimage: registry.internal/${name}:v1.12.3\nresources:\n  limits:\n    cpu: 500m\n    memory: 256Mi`,
  };
}

export async function getGitOpsHistory(name: string) {
  await delay();
  return [
    { sync_time: minutesAgo(12), user: "argocd-bot", commit: "a1b2c3d", result: "Synced", duration: "8s" },
    { sync_time: hoursAgo(6), user: "p.joshipura", commit: "9f8e7d6", result: "Synced", duration: "11s" },
    { sync_time: daysAgo(1), user: "argocd-bot", commit: "5c4b3a2", result: "Failed", duration: "3s" },
  ].map((h) => ({ ...h, app: name }));
}

export async function syncApp(name: string): Promise<{ operation_id: string }> {
  await delay(600);
  return { operation_id: uid("op") + "-" + name };
}

export async function getScoreTemplate(): Promise<{ yaml_template: string }> {
  await delay(150);
  return { yaml_template: SCORE_TEMPLATE };
}

export async function getAvailableResources() {
  await delay();
  return [
    { type: "postgres", name: "PostgreSQL", config_schema: ["name", "size"] },
    { type: "redis", name: "Redis", config_schema: ["name", "memory"] },
    { type: "bucket", name: "Object Storage", config_schema: ["name", "region"] },
    { type: "topic", name: "Pub/Sub Topic", config_schema: ["name"] },
  ];
}

export async function createService(_body: unknown): Promise<{ deployment_id: string }> {
  await delay(700);
  return { deployment_id: uid("dep") };
}

export interface PipelineStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  log: string;
}

export async function getDeploymentStatus(_id: string): Promise<{ steps: PipelineStep[] }> {
  await delay(500);
  return {
    steps: [
      { name: "Parse Score spec", status: "success", log: "Parsed 1 container, 1 resource" },
      { name: "Provision declared resources", status: "success", log: "postgres/db provisioned" },
      { name: "Commit manifests to GitOps repo", status: "success", log: "commit 7a8b9c0 pushed" },
      { name: "GitOps controller sync", status: "running", log: "syncing to cluster…" },
      { name: "Create API gateway route", status: "pending", log: "" },
      { name: "Health check", status: "pending", log: "" },
      { name: "Service live", status: "pending", log: "" },
    ],
  };
}

export async function getInfraResources(): Promise<InfraResource[]> {
  await delay();
  return INFRA_RESOURCES;
}

export async function getInfraResource(name: string) {
  await delay();
  return {
    config: { name, region: "us-central1", tier: "standard", version: "15" },
    conditions: [
      { type: "Ready", status: "True", reason: "Provisioned" },
      { type: "Synced", status: "True", reason: "UpToDate" },
    ],
    events: [
      { time: hoursAgo(2), reason: "Creating", message: "Reconciling resource" },
      { time: hoursAgo(1), reason: "Ready", message: "Resource is ready" },
    ],
    connection_details: {
      host: "10.24.0.14",
      port: "5432",
      username: "app_user",
      password: "••••••••••••",
    },
  };
}

export async function createInfraResource(_body: unknown): Promise<{ resource_id: string }> {
  await delay(600);
  return { resource_id: uid("res") };
}

export async function deleteInfraResource(_name: string): Promise<{ status: string }> {
  await delay(400);
  return { status: "Deleting" };
}

export async function getGatewayRoutes() {
  await delay();
  return GATEWAY_ROUTES;
}
