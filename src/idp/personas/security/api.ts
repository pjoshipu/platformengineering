import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Mock API for the Security / Compliance Engineer persona. All GET endpoints
 * return realistic dummy data; write endpoints return plausible ids/status so
 * screens are fully interactive without a backend.
 */

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type Severity = "Critical" | "High" | "Medium" | "Low";
export type ViolationType = "Policy" | "Guardrail" | "Access";

export interface Violation {
  id: string;
  time: string;
  severity: Severity;
  type: ViolationType;
  resource: string;
  user: string;
  action: string;
}

export interface ComplianceScore {
  namespace: string;
  score: number;
  non_compliant_count: number;
}

export interface SecurityMetrics {
  violations_today: number;
  guardrail_incidents: number;
  access_anomalies: number;
  active_policies: number;
}

export interface Policy {
  id: string;
  name: string;
  kind: string;
  scope: string;
  violations_count: number;
  last_updated: string;
  enforced: boolean;
}

export interface PolicyViolation {
  resource: string;
  namespace: string;
  message: string;
  time: string;
  user: string;
}

export interface PolicyDetail {
  id: string;
  name: string;
  kind: string;
  policy_code: string;
  constraint_config: {
    namespaces: string[];
    enforcement_action: "Deny" | "Warn" | "Audit only";
  };
  violations: PolicyViolation[];
}

export type AuditAction =
  | "Deploy"
  | "Approve"
  | "Rollback"
  | "Policy change"
  | "Access request"
  | "Config change"
  | "Delete";
export type ResourceType = "Service" | "Model" | "Pipeline" | "Policy" | "Dataset" | "Infra";
export type Outcome = "Success" | "Failed" | "Blocked";

export interface AuditEvent {
  id: string;
  ts: string;
  user: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_name: string;
  outcome: Outcome;
  ip: string;
}

export interface AuditEventDetail {
  payload: Record<string, unknown>;
  before_state: string;
  after_state: string;
  related_events: { id: string; ts: string; action: string; resource_name: string; outcome: Outcome }[];
}

export interface AccessRequest {
  id: string;
  requester: string;
  resource: string;
  access_level: string;
  justification: string;
  requested: string;
  status: "Pending" | "Approved" | "Rejected";
}

export interface RoleBinding {
  id: string;
  principal: string;
  role: string;
  scope: string;
  last_used: string;
  risk: "Low" | "Medium" | "High";
}

export interface AccessMetrics {
  users: number;
  service_accounts: number;
  pending_requests: number;
  over_privileged: number;
}

export interface CostRow {
  id: string;
  team: string;
  owner: string;
  mtd_cost: number;
  pct_of_total: number;
  trend: number;
  budget_status: "Under" | "Near" | "Over";
}

export interface CostMetrics {
  total_spend_mtd: number;
  top_team: string;
  untagged_spend: number;
  projected_month: number;
}

export interface ComplianceReport {
  id: string;
  name: string;
  framework: "SOC 2" | "GDPR" | "ISO 27001" | "Internal";
  period: string;
  status: "Draft" | "In review" | "Published";
  score: number;
  generated: string;
}

export interface ReportMetrics {
  overall_compliance: number;
  controls_passing: string;
  open_findings: number;
  next_audit: string;
}

/* ------------------------------------------------------------------ *
 * Dashboard data
 * ------------------------------------------------------------------ */

const VIOLATIONS: Violation[] = [
  { id: uid("v"), time: minutesAgo(8), severity: "Critical", type: "Guardrail", resource: "checkout-api", user: "svc-deployer", action: "Deploy blocked — privileged container" },
  { id: uid("v"), time: minutesAgo(22), severity: "High", type: "Policy", resource: "payments-gateway", user: "a.torres", action: "Warned — missing resource limits" },
  { id: uid("v"), time: minutesAgo(41), severity: "High", type: "Access", resource: "prod-bigquery", user: "j.chen", action: "Anomalous access — off-hours query" },
  { id: uid("v"), time: hoursAgo(2), severity: "Medium", type: "Policy", resource: "search-api", user: "m.rossi", action: "Audited — untrusted image registry" },
  { id: uid("v"), time: hoursAgo(3), severity: "Low", type: "Policy", resource: "notifications", user: "argocd-bot", action: "Audited — missing owner label" },
  { id: uid("v"), time: hoursAgo(5), severity: "High", type: "Guardrail", resource: "ml-training-job", user: "d.patel", action: "Blocked — GPU quota over budget" },
  { id: uid("v"), time: hoursAgo(7), severity: "Medium", type: "Access", resource: "secrets-vault", user: "contractor-01", action: "Flagged — broad secret read scope" },
  { id: uid("v"), time: hoursAgo(11), severity: "Low", type: "Policy", resource: "inventory-svc", user: "p.joshipura", action: "Audited — no network policy" },
];

const COMPLIANCE: ComplianceScore[] = [
  { namespace: "prod", score: 94, non_compliant_count: 3 },
  { namespace: "staging", score: 88, non_compliant_count: 6 },
  { namespace: "data-platform", score: 79, non_compliant_count: 11 },
  { namespace: "ml-serving", score: 91, non_compliant_count: 4 },
  { namespace: "dev", score: 72, non_compliant_count: 18 },
];

export async function getViolations(range = "24h"): Promise<Violation[]> {
  await delay();
  void range;
  return VIOLATIONS;
}

export async function getCompliance(): Promise<ComplianceScore[]> {
  await delay();
  return COMPLIANCE;
}

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  await delay(260);
  return { violations_today: 8, guardrail_incidents: 2, access_anomalies: 2, active_policies: 24 };
}

/* ------------------------------------------------------------------ *
 * Policy Manager data
 * ------------------------------------------------------------------ */

const POLICIES: Policy[] = [
  { id: "pol_limits", name: "require-resource-limits", kind: "K8sRequiredResources", scope: "prod, staging", violations_count: 4, last_updated: daysAgo(2), enforced: true },
  { id: "pol_labels", name: "require-owner-labels", kind: "K8sRequiredLabels", scope: "all namespaces", violations_count: 12, last_updated: daysAgo(6), enforced: true },
  { id: "pol_priv", name: "block-privileged-containers", kind: "K8sPSPPrivileged", scope: "prod", violations_count: 1, last_updated: hoursAgo(9), enforced: true },
  { id: "pol_registry", name: "restrict-image-registries", kind: "K8sAllowedRepos", scope: "prod, staging", violations_count: 3, last_updated: daysAgo(1), enforced: false },
  { id: "pol_netpol", name: "require-network-policy", kind: "K8sRequiredNetworkPolicy", scope: "prod", violations_count: 7, last_updated: daysAgo(14), enforced: false },
];

const SAMPLE_POLICY_CODE = `package k8srequiredlimits

violation[{"msg": msg}] {
  container := input.review.object.spec.containers[_]
  not container.resources.limits.cpu
  msg := sprintf("Container %v has no CPU limit", [container.name])
}

violation[{"msg": msg}] {
  container := input.review.object.spec.containers[_]
  not container.resources.limits.memory
  msg := sprintf("Container %v has no memory limit", [container.name])
}`;

const POLICY_VIOLATIONS: PolicyViolation[] = [
  { resource: "checkout-api-7f9c", namespace: "prod", message: "Container main has no CPU limit", time: hoursAgo(3), user: "a.torres" },
  { resource: "search-api-2b1d", namespace: "staging", message: "Container main has no memory limit", time: hoursAgo(8), user: "m.rossi" },
  { resource: "batch-worker-88", namespace: "prod", message: "Container sidecar has no CPU limit", time: daysAgo(1), user: "d.patel" },
  { resource: "cron-cleanup", namespace: "prod", message: "Container job has no memory limit", time: daysAgo(2), user: "argocd-bot" },
];

const POLICY_TEMPLATES = [
  { id: "tpl_limits", name: "Require resource limits", kind: "K8sRequiredResources", description: "Deny workloads that don't set CPU/memory requests and limits." },
  { id: "tpl_labels", name: "Require labels", kind: "K8sRequiredLabels", description: "Require owner / cost-center labels on all resources." },
  { id: "tpl_priv", name: "Block privileged containers", kind: "K8sPSPPrivileged", description: "Reject pods running privileged or with hostPID/hostNetwork." },
  { id: "tpl_registry", name: "Restrict image registries", kind: "K8sAllowedRepos", description: "Allow images only from approved internal registries." },
  { id: "tpl_blank", name: "Custom blank", kind: "Custom", description: "Start from an empty Rego policy." },
];

export async function getPolicies(): Promise<Policy[]> {
  await delay();
  return POLICIES;
}

export async function getPolicy(id: string): Promise<PolicyDetail> {
  await delay();
  const p = POLICIES.find((x) => x.id === id) ?? POLICIES[0];
  return {
    id: p.id,
    name: p.name,
    kind: p.kind,
    policy_code: SAMPLE_POLICY_CODE,
    constraint_config: {
      namespaces: p.scope.split(",").map((s) => s.trim()),
      enforcement_action: p.enforced ? "Deny" : "Audit only",
    },
    violations: POLICY_VIOLATIONS,
  };
}

export async function getPolicyViolations(id: string): Promise<PolicyViolation[]> {
  await delay();
  void id;
  return POLICY_VIOLATIONS;
}

export async function getPolicyTemplates() {
  await delay(180);
  return POLICY_TEMPLATES;
}

export async function createPolicy(_body: unknown): Promise<{ policy_id: string }> {
  await delay(600);
  return { policy_id: uid("pol") };
}

export async function updatePolicy(_id: string, _body: unknown): Promise<{ status: string }> {
  await delay(400);
  return { status: "updated" };
}

export async function testPolicy(
  _id: string,
  sample_resource: string
): Promise<{ result: "Pass" | "Fail"; message: string }> {
  await delay(500);
  // Naive mock: fail if the sample lacks resource limits.
  const fails = !/limits/.test(sample_resource) || /privileged:\s*true/.test(sample_resource);
  return fails
    ? { result: "Fail", message: "Container main has no CPU/memory limit set — would be denied." }
    : { result: "Pass", message: "Resource satisfies all constraints." };
}

export async function deployPolicy(_id: string): Promise<{ status: string }> {
  await delay(700);
  return { status: "deployed" };
}

/* ------------------------------------------------------------------ *
 * Audit Log data
 * ------------------------------------------------------------------ */

const AUDIT_USERS = ["a.torres", "j.chen", "m.rossi", "d.patel", "p.joshipura", "svc-deployer", "argocd-bot", "contractor-01"];
const AUDIT_ACTIONS: AuditAction[] = ["Deploy", "Approve", "Rollback", "Policy change", "Access request", "Config change", "Delete"];
const AUDIT_RESOURCE_TYPES: ResourceType[] = ["Service", "Model", "Pipeline", "Policy", "Dataset", "Infra"];
const AUDIT_OUTCOMES: Outcome[] = ["Success", "Success", "Success", "Failed", "Blocked"];
const AUDIT_NAMES = ["checkout-api", "payments-gateway", "fraud-model-v3", "etl-nightly", "require-owner-labels", "prod-bigquery", "orders-redis", "search-api"];

// Deterministic-ish generated audit log so paging is meaningful.
const AUDIT_EVENTS: AuditEvent[] = Array.from({ length: 68 }).map((_, i) => ({
  id: `evt_${String(i + 1).padStart(4, "0")}`,
  ts: minutesAgo(i * 37 + 3),
  user: AUDIT_USERS[i % AUDIT_USERS.length],
  action: AUDIT_ACTIONS[i % AUDIT_ACTIONS.length],
  resource_type: AUDIT_RESOURCE_TYPES[i % AUDIT_RESOURCE_TYPES.length],
  resource_name: AUDIT_NAMES[i % AUDIT_NAMES.length],
  outcome: AUDIT_OUTCOMES[i % AUDIT_OUTCOMES.length],
  ip: `10.24.${(i % 6) + 1}.${((i * 13) % 250) + 2}`,
}));

export interface AuditQuery {
  start?: string;
  end?: string;
  user?: string;
  action?: string;
  resource_type?: string;
  outcome?: string;
  page?: number;
}

const AUDIT_PAGE_SIZE = 12;

export async function getAuditEvents(q: AuditQuery = {}): Promise<{ total: number; events: AuditEvent[]; page: number; page_size: number }> {
  await delay();
  let rows = AUDIT_EVENTS;
  if (q.user) rows = rows.filter((e) => e.user.toLowerCase().includes(q.user!.toLowerCase()));
  if (q.action && q.action !== "all") rows = rows.filter((e) => e.action === q.action);
  if (q.resource_type && q.resource_type !== "all") rows = rows.filter((e) => e.resource_type === q.resource_type);
  if (q.outcome && q.outcome !== "all") rows = rows.filter((e) => e.outcome === q.outcome);
  const page = q.page ?? 1;
  const total = rows.length;
  const events = rows.slice((page - 1) * AUDIT_PAGE_SIZE, page * AUDIT_PAGE_SIZE);
  return { total, events, page, page_size: AUDIT_PAGE_SIZE };
}

export async function getAuditEvent(eventId: string): Promise<AuditEventDetail> {
  await delay();
  const evt = AUDIT_EVENTS.find((e) => e.id === eventId) ?? AUDIT_EVENTS[0];
  return {
    payload: {
      event_id: evt.id,
      timestamp: evt.ts,
      actor: { user: evt.user, ip: evt.ip, session: uid("sess") },
      action: evt.action,
      target: { type: evt.resource_type, name: evt.resource_name, namespace: "prod" },
      outcome: evt.outcome,
      request_id: uid("req"),
      user_agent: "platform-cli/2.4.0",
    },
    before_state: `replicas: 2\nimage: registry.internal/${evt.resource_name}:v1.2.3\nenforced: false`,
    after_state: `replicas: 3\nimage: registry.internal/${evt.resource_name}:v1.2.4\nenforced: true`,
    related_events: AUDIT_EVENTS.filter((e) => e.resource_name === evt.resource_name && e.id !== evt.id)
      .slice(0, 4)
      .map((e) => ({ id: e.id, ts: e.ts, action: e.action, resource_name: e.resource_name, outcome: e.outcome })),
  };
}

export async function exportAudit(_format: "csv" | "siem", _q: AuditQuery): Promise<{ status: string }> {
  await delay(500);
  return { status: "exported" };
}

/* ------------------------------------------------------------------ *
 * Access Governance data
 * ------------------------------------------------------------------ */

const ACCESS_REQUESTS: AccessRequest[] = [
  { id: uid("ar"), requester: "j.chen", resource: "prod-bigquery / fraud_features", access_level: "Read", justification: "Building fraud detection features for Q3 model.", requested: hoursAgo(3), status: "Pending" },
  { id: uid("ar"), requester: "contractor-01", resource: "secrets-vault / payments", access_level: "Read", justification: "Debugging payment webhook signature mismatch.", requested: hoursAgo(6), status: "Pending" },
  { id: uid("ar"), requester: "d.patel", resource: "ml-serving cluster", access_level: "Admin", justification: "On-call rotation for model-serving incidents.", requested: daysAgo(1), status: "Pending" },
  { id: uid("ar"), requester: "m.rossi", resource: "prod namespace / deploy", access_level: "Write", justification: "Promoting search-api release to prod.", requested: daysAgo(2), status: "Approved" },
  { id: uid("ar"), requester: "a.torres", resource: "cost-dashboard", access_level: "Read", justification: "Monthly chargeback reporting.", requested: daysAgo(3), status: "Approved" },
  { id: uid("ar"), requester: "intern-04", resource: "prod database / customers", access_level: "Admin", justification: "Requested full admin for a data cleanup task.", requested: daysAgo(4), status: "Rejected" },
];

const ROLE_BINDINGS: RoleBinding[] = [
  { id: uid("rb"), principal: "contractor-01", role: "secrets-reader", scope: "cluster-wide", last_used: hoursAgo(7), risk: "High" },
  { id: uid("rb"), principal: "svc-deployer", role: "cluster-admin", scope: "cluster-wide", last_used: minutesAgo(40), risk: "High" },
  { id: uid("rb"), principal: "j.chen", role: "bigquery-dataViewer", scope: "data-platform", last_used: hoursAgo(2), risk: "Medium" },
  { id: uid("rb"), principal: "legacy-etl-sa", role: "storage-admin", scope: "data-platform", last_used: daysAgo(94), risk: "High" },
  { id: uid("rb"), principal: "m.rossi", role: "namespace-editor", scope: "prod", last_used: hoursAgo(5), risk: "Low" },
  { id: uid("rb"), principal: "a.torres", role: "viewer", scope: "all", last_used: daysAgo(1), risk: "Low" },
];

export async function getAccessMetrics(): Promise<AccessMetrics> {
  await delay(260);
  return { users: 142, service_accounts: 58, pending_requests: 3, over_privileged: 4 };
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
  await delay();
  return ACCESS_REQUESTS;
}

export async function getRoleBindings(): Promise<RoleBinding[]> {
  await delay();
  return ROLE_BINDINGS;
}

export async function decideAccessRequest(_id: string, _decision: "Approved" | "Rejected"): Promise<{ status: string }> {
  await delay(400);
  return { status: "recorded" };
}

export async function revokeBinding(_id: string): Promise<{ status: string }> {
  await delay(400);
  return { status: "revoked" };
}

/* ------------------------------------------------------------------ *
 * Cost Attribution data
 * ------------------------------------------------------------------ */

const COST_ROWS: CostRow[] = [
  { id: uid("c"), team: "payments", owner: "a.torres", mtd_cost: 48200, pct_of_total: 31, trend: 6, budget_status: "Near" },
  { id: uid("c"), team: "ml-platform", owner: "d.patel", mtd_cost: 39100, pct_of_total: 25, trend: 22, budget_status: "Over" },
  { id: uid("c"), team: "checkout", owner: "m.rossi", mtd_cost: 27400, pct_of_total: 18, trend: -4, budget_status: "Under" },
  { id: uid("c"), team: "data-eng", owner: "j.chen", mtd_cost: 21800, pct_of_total: 14, trend: 3, budget_status: "Under" },
  { id: uid("c"), team: "platform", owner: "p.joshipura", mtd_cost: 12600, pct_of_total: 8, trend: 1, budget_status: "Under" },
  { id: uid("c"), team: "untagged", owner: "—", mtd_cost: 6200, pct_of_total: 4, trend: 9, budget_status: "Near" },
];

const COST_BY_TEAM = COST_ROWS.map((r) => ({ name: r.team, value: r.mtd_cost }));

const COST_OVER_TIME = Array.from({ length: 12 }).map((_, i) => ({
  ts: `W${i + 1}`,
  spend: 9000 + Math.round(Math.sin(i / 2) * 1800) + i * 380,
}));

const COST_BY_CATEGORY = Array.from({ length: 6 }).map((_, i) => ({
  ts: `M${i + 1}`,
  compute: 42000 + i * 1200,
  llm: 18000 + i * 2600,
  storage: 9000 + i * 300,
  data: 12000 + i * 700,
}));

export async function getCostMetrics(): Promise<CostMetrics> {
  await delay(260);
  return { total_spend_mtd: 155300, top_team: "payments", untagged_spend: 6200, projected_month: 198400 };
}

export async function getCostRows(): Promise<CostRow[]> {
  await delay();
  return COST_ROWS;
}

export async function getCostCharts() {
  await delay();
  return { by_team: COST_BY_TEAM, over_time: COST_OVER_TIME, by_category: COST_BY_CATEGORY };
}

/* ------------------------------------------------------------------ *
 * Compliance Reports data
 * ------------------------------------------------------------------ */

const REPORTS: ComplianceReport[] = [
  { id: uid("rep"), name: "SOC 2 Type II — H1 2026", framework: "SOC 2", period: "Jan–Jun 2026", status: "In review", score: 92, generated: daysAgo(3) },
  { id: uid("rep"), name: "GDPR Data Processing Audit", framework: "GDPR", period: "Q2 2026", status: "Published", score: 88, generated: daysAgo(9) },
  { id: uid("rep"), name: "ISO 27001 Annex A Controls", framework: "ISO 27001", period: "2026", status: "Draft", score: 81, generated: daysAgo(1) },
  { id: uid("rep"), name: "Internal Platform Security Review", framework: "Internal", period: "June 2026", status: "Published", score: 95, generated: daysAgo(14) },
  { id: uid("rep"), name: "SOC 2 Type I — Readiness", framework: "SOC 2", period: "2025", status: "Published", score: 90, generated: daysAgo(120) },
];

const CONTROLS: Record<string, { id: string; control: string; status: "Pass" | "Fail" | "N/A" }[]> = {
  "SOC 2": [
    { id: "CC6.1", control: "Logical access controls restrict unauthorized access", status: "Pass" },
    { id: "CC6.6", control: "Encryption of data at rest and in transit", status: "Pass" },
    { id: "CC7.2", control: "Security monitoring detects anomalies", status: "Fail" },
    { id: "CC8.1", control: "Change management follows approval workflow", status: "Pass" },
  ],
  GDPR: [
    { id: "Art.30", control: "Records of processing activities maintained", status: "Pass" },
    { id: "Art.32", control: "Appropriate technical & organizational measures", status: "Pass" },
    { id: "Art.33", control: "Breach notification within 72 hours", status: "Fail" },
  ],
  "ISO 27001": [
    { id: "A.5.1", control: "Information security policies defined", status: "Pass" },
    { id: "A.8.1", control: "Asset inventory maintained", status: "Fail" },
    { id: "A.9.2", control: "User access provisioning controlled", status: "Pass" },
  ],
  Internal: [
    { id: "INT-1", control: "All prod workloads have resource limits", status: "Fail" },
    { id: "INT-2", control: "No privileged containers in prod", status: "Pass" },
    { id: "INT-3", control: "Secrets rotated within 90 days", status: "Pass" },
  ],
};

export async function getReportMetrics(): Promise<ReportMetrics> {
  await delay(260);
  return { overall_compliance: 90, controls_passing: "132 / 148", open_findings: 16, next_audit: "18 Sep 2026" };
}

export async function getReports(): Promise<ComplianceReport[]> {
  await delay();
  return REPORTS;
}

export async function getReportControls(framework: string) {
  await delay();
  return CONTROLS[framework] ?? CONTROLS["Internal"];
}

export async function generateReport(_body: unknown): Promise<{ report_id: string }> {
  await delay(700);
  return { report_id: uid("rep") };
}
