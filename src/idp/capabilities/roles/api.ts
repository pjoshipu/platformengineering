import { delay, uid, minutesAgo, hoursAgo, daysAgo } from "../../api/client";

/**
 * Capability 4.3 — Role-Based Management (admin-only, security persona).
 *
 * Admins control what each persona can see/do. This mock API backs the six
 * sub-areas of the screen: Users, Roles (per-persona can/cannot facts),
 * Elevation requests, Access review, Audit trail, and Teams. Every function
 * awaits `delay()` so the screen shares the standard loading pattern; write
 * endpoints return a plausible id/status object and are wired to toasts.
 */

/* --------------------------------- Types --------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  persona: string;
  team: string;
  status: string; // Active | Invited | Suspended
}

export interface Role {
  persona: string;
  label: string;
  can: string[];
  /** actions the role CANNOT do without an elevation grant */
  cannot: string[];
}

export interface Elevation {
  id: string;
  requester: string;
  current_persona: string;
  requested_permission: string;
  scope: string;
  duration: string;
  justification: string;
  status: string; // Pending | Approved | Denied
  requested_at: string;
  expires_at?: string;
}

export interface AccessReviewItem {
  id: string;
  principal: string;
  role: string;
  last_used: string;
  risk: string; // Low | Medium | High
  status: string; // Pending | Attested
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string; // Granted | Revoked | Modified | Elevated | Attested
  permission: string;
  target: string;
  at: string;
}

export interface Team {
  id: string;
  name: string;
  members: number;
  data_scope: string;
  resource_scope: string;
}

export interface CreateTeamBody {
  name: string;
  data_scope?: string;
  resource_scope?: string;
}

/* ------------------------------- Mock data ------------------------------- */

const USERS: User[] = [
  { id: "u_ava", name: "Ava Chen", email: "ava.chen@corp.dev", persona: "ai-engineer", team: "applied-ai", status: "Active" },
  { id: "u_ben", name: "Ben Okafor", email: "ben.okafor@corp.dev", persona: "agentic-engineer", team: "autonomous-systems", status: "Active" },
  { id: "u_cara", name: "Cara Diaz", email: "cara.diaz@corp.dev", persona: "data-scientist", team: "ds-team", status: "Active" },
  { id: "u_dan", name: "Dan Reeves", email: "dan.reeves@corp.dev", persona: "app-engineer", team: "payments", status: "Active" },
  { id: "u_eli", name: "Eli Novak", email: "eli.novak@corp.dev", persona: "mlops", team: "ml-platform", status: "Active" },
  { id: "u_fay", name: "Fay Morgan", email: "fay.morgan@corp.dev", persona: "security", team: "security", status: "Active" },
  { id: "u_gil", name: "Gil Haddad", email: "gil.haddad@corp.dev", persona: "data-engineer", team: "data-platform", status: "Active" },
  { id: "u_hana", name: "Hana Suzuki", email: "hana.suzuki@corp.dev", persona: "app-engineer", team: "commerce", status: "Invited" },
  { id: "u_ivan", name: "Ivan Petrov", email: "ivan.petrov@corp.dev", persona: "data-scientist", team: "ds-team", status: "Suspended" },
  { id: "u_joy", name: "Joy Adeyemi", email: "joy.adeyemi@corp.dev", persona: "ai-engineer", team: "data-tools", status: "Active" },
];

const ROLES: Role[] = [
  {
    persona: "ai-engineer",
    label: "AI Engineer",
    can: ["Deploy LLM apps", "Manage prompts", "Configure guardrails", "View observability", "Approve canary"],
    cannot: ["Modify OPA policies", "Access other teams' cost", "Approve model promotion"],
  },
  {
    persona: "agentic-engineer",
    label: "Agentic Engineer",
    can: ["Deploy agents", "Manage tools/autonomy within budget", "Approve checkpoints for own agents"],
    cannot: ["Grant new write-scoped tools org-wide", "Raise autonomy caps beyond policy", "Modify OPA policies"],
  },
  {
    persona: "data-scientist",
    label: "Data Scientist",
    can: ["Submit training", "View own experiments", "Request dataset access", "Promote to staging"],
    cannot: ["Approve own model to prod", "Access restricted datasets", "Modify pipelines"],
  },
  {
    persona: "app-engineer",
    label: "App / Platform Engineer",
    can: ["Deploy services", "Provision resources", "Manage GitOps", "Configure Kong"],
    cannot: ["Modify OPA policies", "Access prod secrets", "Approve own prod deploys"],
  },
  {
    persona: "mlops",
    label: "MLOps Engineer",
    can: ["Manage ML pipelines", "Configure drift monitors", "Create retraining rules", "View all model metrics"],
    cannot: ["Approve model promotion", "Modify infra outside ML namespace"],
  },
  {
    persona: "security",
    label: "Security Engineer",
    can: ["Deploy/modify OPA", "View all audit logs", "Revoke access", "Run scans", "Export audit"],
    cannot: ["Approve prod deployments", "Modify app configs"],
  },
  {
    persona: "data-engineer",
    label: "Data Engineer",
    can: ["Build/trigger pipelines", "Publish datasets", "Manage feature groups", "View lineage"],
    cannot: ["Approve cross-team dataset access", "Modify PII-flagged datasets without security review"],
  },
];

const ELEVATIONS: Elevation[] = [
  {
    id: "el_1",
    requester: "Ava Chen",
    current_persona: "ai-engineer",
    requested_permission: "Approve model promotion",
    scope: "support-rag (applied-ai)",
    duration: "4h",
    justification: "On-call approver out; canary metrics green, need to promote v1.4.0 for release window.",
    status: "Pending",
    requested_at: minutesAgo(18),
  },
  {
    id: "el_2",
    requester: "Ben Okafor",
    current_persona: "agentic-engineer",
    requested_permission: "Raise autonomy caps beyond policy",
    scope: "infra-remediation-agent",
    duration: "2h",
    justification: "Incident INC-4821 remediation requires temporary High autonomy to auto-restart rollouts.",
    status: "Pending",
    requested_at: minutesAgo(41),
  },
  {
    id: "el_3",
    requester: "Cara Diaz",
    current_persona: "data-scientist",
    requested_permission: "Access restricted datasets",
    scope: "customer-churn-2026",
    duration: "1d",
    justification: "Feature parity investigation for fraud-detection retrain; read-only.",
    status: "Pending",
    requested_at: hoursAgo(2),
  },
  {
    id: "el_4",
    requester: "Dan Reeves",
    current_persona: "app-engineer",
    requested_permission: "Access prod secrets",
    scope: "checkout-api",
    duration: "1h",
    justification: "Rotate leaked Stripe webhook secret flagged by secret scan.",
    status: "Approved",
    requested_at: hoursAgo(6),
    expires_at: hoursAgo(5),
  },
];

const ACCESS_REVIEW: AccessReviewItem[] = [
  { id: "ar_1", principal: "Ivan Petrov", role: "data-scientist", last_used: daysAgo(63), risk: "High", status: "Pending" },
  { id: "ar_2", principal: "svc-ci-deployer", role: "app-engineer", last_used: daysAgo(2), risk: "Medium", status: "Pending" },
  { id: "ar_3", principal: "Joy Adeyemi", role: "ai-engineer", last_used: hoursAgo(9), risk: "Low", status: "Pending" },
  { id: "ar_4", principal: "release-captain (agent)", role: "agentic-engineer", last_used: daysAgo(21), risk: "High", status: "Pending" },
  { id: "ar_5", principal: "Eli Novak", role: "mlops", last_used: daysAgo(4), risk: "Low", status: "Attested" },
];

const AUDIT: AuditEntry[] = [
  { id: "au_1", actor: "Fay Morgan", action: "Granted", permission: "Access prod secrets", target: "Dan Reeves", at: hoursAgo(5) },
  { id: "au_2", actor: "Fay Morgan", action: "Revoked", permission: "Access restricted datasets", target: "Ivan Petrov", at: daysAgo(1) },
  { id: "au_3", actor: "system", action: "Elevated", permission: "Approve canary", target: "Ava Chen", at: daysAgo(2) },
  { id: "au_4", actor: "Fay Morgan", action: "Modified", permission: "Autonomy cap (Medium→Low)", target: "infra-remediation-agent", at: daysAgo(3) },
  { id: "au_5", actor: "Eli Novak", action: "Attested", permission: "mlops role", target: "self", at: daysAgo(4) },
  { id: "au_6", actor: "Fay Morgan", action: "Revoked", permission: "Modify OPA policies", target: "Dan Reeves", at: daysAgo(6) },
];

const TEAMS: Team[] = [
  { id: "t_applied_ai", name: "applied-ai", members: 8, data_scope: "crm.*, support.*", resource_scope: "ns/applied-ai, gpu-a100" },
  { id: "t_autonomous", name: "autonomous-systems", members: 5, data_scope: "ops.*", resource_scope: "ns/agents, cluster:write" },
  { id: "t_ds", name: "ds-team", members: 6, data_scope: "analytics.*, ml.*", resource_scope: "ns/ds, gpu-a100" },
  { id: "t_payments", name: "payments", members: 9, data_scope: "payments.*", resource_scope: "ns/payments" },
  { id: "t_ml_platform", name: "ml-platform", members: 4, data_scope: "ml.*, feature-store", resource_scope: "ns/ml-platform, gpu-a100" },
  { id: "t_security", name: "security", members: 3, data_scope: "audit.*, org-wide (read)", resource_scope: "org-wide (policy)" },
  { id: "t_data_platform", name: "data-platform", members: 7, data_scope: "analytics.*, raw.*", resource_scope: "ns/data-platform" },
];

/* ------------------------------- Endpoints ------------------------------- */

export async function getUsers(): Promise<User[]> {
  await delay();
  return USERS;
}

export async function getRoles(): Promise<Role[]> {
  await delay();
  return ROLES;
}

export async function getElevations(): Promise<Elevation[]> {
  await delay();
  return ELEVATIONS;
}

export async function decideElevation(
  id: string,
  decision: "Approved" | "Denied"
): Promise<{ id: string; status: string; expires_at?: string }> {
  await delay();
  // Approvals set a short-lived expiry window; denials clear it.
  const expires_at = decision === "Approved" ? hoursAgo(-4) : undefined;
  return { id, status: decision, expires_at };
}

export async function getAccessReview(): Promise<AccessReviewItem[]> {
  await delay();
  return ACCESS_REVIEW;
}

export async function attestReview(id: string): Promise<{ id: string; status: string }> {
  await delay();
  return { id, status: "Attested" };
}

export async function getPermissionAudit(): Promise<AuditEntry[]> {
  await delay();
  return AUDIT;
}

export async function getTeams(): Promise<Team[]> {
  await delay();
  return TEAMS;
}

export async function createTeam(body: CreateTeamBody): Promise<Team> {
  await delay();
  return {
    id: uid("t"),
    name: body.name,
    members: 1,
    data_scope: body.data_scope?.trim() || "none",
    resource_scope: body.resource_scope?.trim() || "none",
  };
}
