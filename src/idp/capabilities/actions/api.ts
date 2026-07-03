import { delay, uid } from "../../api/client";

/**
 * Capability 3.1 — Self-Service Actions (persona-parameterized mock).
 *
 * ONE persona-aware screen: `getActions(persona)` returns the pre-approved
 * actions that persona can run without a ticket. Each action carries the
 * guardrails enforced before execution and a small set of form fields.
 * `runPreflight` turns the guardrails into pass/fail checks; `executeAction`
 * kicks off the (mock) run. Mirrors the catalog capability's structure.
 */

export interface ActionField {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
}

export interface SelfServiceAction {
  id: string;
  label: string;
  asset_type: string;
  description: string;
  guardrails: string[];
  fields: ActionField[];
}

const ACTIONS: Record<string, SelfServiceAction[]> = {
  "ai-engineer": [
    {
      id: "aie_deploy_llm",
      label: "Deploy LLM app",
      asset_type: "LLM app",
      description: "Ship an LLM app to a rollout stage with guardrail policies auto-applied.",
      guardrails: ["Cost cap enforced ($/day)", "Guardrail policies auto-applied pre-deploy"],
      fields: [
        { name: "app", label: "App", type: "text", placeholder: "support-rag" },
        { name: "stage", label: "Stage", type: "select", options: ["canary", "staging", "prod"] },
      ],
    },
    {
      id: "aie_update_prompt",
      label: "Update prompt version",
      asset_type: "Prompt registry",
      description: "Promote a new prompt version in the registry for an app.",
      guardrails: ["Guardrail policies auto-applied pre-deploy"],
      fields: [
        { name: "registry", label: "Prompt registry", type: "text", placeholder: "support-prompts" },
        { name: "version", label: "New version", type: "text", placeholder: "v13" },
      ],
    },
    {
      id: "aie_canary_split",
      label: "Adjust canary split",
      asset_type: "LLM app",
      description: "Change the traffic percentage sent to the canary revision.",
      guardrails: ["Cost cap enforced ($/day)"],
      fields: [
        { name: "app", label: "App", type: "text", placeholder: "docs-assistant" },
        { name: "percent", label: "Canary %", type: "number", placeholder: "10" },
      ],
    },
    {
      id: "aie_toggle_guardrail",
      label: "Enable / disable guardrail",
      asset_type: "Guardrail",
      description: "Toggle a guardrail policy for an LLM app.",
      guardrails: ["Guardrail policies auto-applied pre-deploy"],
      fields: [
        { name: "app", label: "App", type: "text", placeholder: "support-rag" },
        { name: "state", label: "State", type: "select", options: ["enable", "disable"] },
      ],
    },
    {
      id: "aie_rollback",
      label: "Rollback",
      asset_type: "LLM app",
      description: "Roll an LLM app back to its previous known-good revision.",
      guardrails: ["Cost cap enforced ($/day)"],
      fields: [{ name: "app", label: "App", type: "text", placeholder: "sql-copilot" }],
    },
    {
      id: "aie_scale",
      label: "Scale replicas",
      asset_type: "LLM app",
      description: "Set the replica count for a serving deployment.",
      guardrails: ["Cost cap enforced ($/day)"],
      fields: [
        { name: "app", label: "App", type: "text", placeholder: "support-rag" },
        { name: "replicas", label: "Replicas", type: "number", placeholder: "3" },
      ],
    },
  ],
  "agentic-engineer": [
    {
      id: "age_deploy_agent",
      label: "Deploy agent",
      asset_type: "Agent",
      description: "Deploy an agent to the runtime with an autonomy budget.",
      guardrails: ["Write-scoped tools require HITL", "Autonomy budget cap enforced"],
      fields: [
        { name: "agent", label: "Agent", type: "text", placeholder: "support-triage-agent" },
        { name: "autonomy", label: "Autonomy", type: "select", options: ["Low", "Medium", "High"] },
      ],
    },
    {
      id: "age_autonomy_budget",
      label: "Adjust autonomy budget",
      asset_type: "Agent",
      description: "Set the per-run action budget an agent may spend autonomously.",
      guardrails: ["Autonomy budget cap enforced"],
      fields: [
        { name: "agent", label: "Agent", type: "text", placeholder: "release-captain" },
        { name: "budget", label: "Actions / run", type: "number", placeholder: "25" },
      ],
    },
    {
      id: "age_hitl",
      label: "Approve / reject HITL checkpoint",
      asset_type: "Checkpoint",
      description: "Resolve a pending human-in-the-loop checkpoint for an agent run.",
      guardrails: ["Write-scoped tools require HITL"],
      fields: [
        { name: "checkpoint", label: "Checkpoint id", type: "text", placeholder: "chk_a1b2c3" },
        { name: "decision", label: "Decision", type: "select", options: ["approve", "reject"] },
      ],
    },
    {
      id: "age_toggle_tool",
      label: "Enable / disable tool",
      asset_type: "Tool",
      description: "Toggle a tool binding for an agent.",
      guardrails: ["Write-scoped tools require HITL"],
      fields: [
        { name: "tool", label: "Tool", type: "text", placeholder: "k8s.rollout_restart" },
        { name: "state", label: "State", type: "select", options: ["enable", "disable"] },
      ],
    },
    {
      id: "age_pause_resume",
      label: "Pause / resume agent",
      asset_type: "Agent",
      description: "Pause or resume an agent's scheduled and triggered runs.",
      guardrails: ["Autonomy budget cap enforced"],
      fields: [
        { name: "agent", label: "Agent", type: "text", placeholder: "infra-remediation-agent" },
        { name: "state", label: "State", type: "select", options: ["pause", "resume"] },
      ],
    },
    {
      id: "age_rollback",
      label: "Rollback version",
      asset_type: "Agent",
      description: "Roll an agent back to its previous deployed version.",
      guardrails: ["Write-scoped tools require HITL", "Autonomy budget cap enforced"],
      fields: [{ name: "agent", label: "Agent", type: "text", placeholder: "release-captain" }],
    },
  ],
  "data-scientist": [
    {
      id: "ds_train",
      label: "Submit training request",
      asset_type: "Experiment",
      description: "Queue a training run against a compute pool.",
      guardrails: ["Compute quota check"],
      fields: [
        { name: "experiment", label: "Experiment", type: "text", placeholder: "recsys-tower" },
        { name: "compute", label: "Compute", type: "select", options: ["cpu-4x", "gpu-a100", "gpu-h100"] },
      ],
    },
    {
      id: "ds_promote",
      label: "Promote model → staging",
      asset_type: "Model",
      description: "Promote a model version from experiment to the staging registry.",
      guardrails: ["Compute quota check", "Metric-threshold gate before promotion"],
      fields: [
        { name: "model", label: "Model", type: "text", placeholder: "fraud-detection" },
        { name: "version", label: "Version", type: "text", placeholder: "v4" },
      ],
    },
    {
      id: "ds_dataset_access",
      label: "Request dataset access",
      asset_type: "Dataset",
      description: "Request read access to a governed dataset.",
      guardrails: ["Compute quota check"],
      fields: [{ name: "dataset", label: "Dataset", type: "text", placeholder: "customer-churn-2026" }],
    },
    {
      id: "ds_clone_exp",
      label: "Clone experiment",
      asset_type: "Experiment",
      description: "Fork an existing experiment with its config.",
      guardrails: ["Compute quota check"],
      fields: [
        { name: "experiment", label: "Source experiment", type: "text", placeholder: "recsys-tower" },
        { name: "name", label: "New name", type: "text", placeholder: "recsys-tower-v2" },
      ],
    },
    {
      id: "ds_eval",
      label: "Trigger eval",
      asset_type: "Model",
      description: "Run the eval suite for a model version.",
      guardrails: ["Compute quota check", "Metric-threshold gate before promotion"],
      fields: [{ name: "model", label: "Model", type: "text", placeholder: "churn-predictor" }],
    },
  ],
  "app-engineer": [
    {
      id: "app_deploy_service",
      label: "Deploy service",
      asset_type: "Service",
      description: "Deploy a service from its Score spec to an environment.",
      guardrails: ["OPA policy check pre-deploy", "Resource limits enforced"],
      fields: [
        { name: "service", label: "Service", type: "text", placeholder: "checkout-api" },
        { name: "env", label: "Environment", type: "select", options: ["staging", "prod"] },
      ],
    },
    {
      id: "app_provision",
      label: "Provision resource",
      asset_type: "Resource",
      description: "Provision a backing resource from the paved-road catalog.",
      guardrails: ["OPA policy check pre-deploy", "Resource limits enforced"],
      fields: [
        { name: "kind", label: "Resource", type: "select", options: ["postgres", "redis", "s3-bucket", "queue"] },
        { name: "name", label: "Name", type: "text", placeholder: "checkout-cache" },
      ],
    },
    {
      id: "app_gitops_sync",
      label: "Sync GitOps app",
      asset_type: "Service",
      description: "Trigger an Argo CD sync for a GitOps application.",
      guardrails: ["OPA policy check pre-deploy"],
      fields: [{ name: "service", label: "App", type: "text", placeholder: "inventory-svc" }],
    },
    {
      id: "app_kong_route",
      label: "Create Kong route",
      asset_type: "Route",
      description: "Add an API gateway route for a service.",
      guardrails: ["OPA policy check pre-deploy"],
      fields: [
        { name: "service", label: "Service", type: "text", placeholder: "notifications" },
        { name: "path", label: "Path", type: "text", placeholder: "/api/notify" },
      ],
    },
    {
      id: "app_scale",
      label: "Scale",
      asset_type: "Service",
      description: "Set the replica count for a service.",
      guardrails: ["Resource limits enforced"],
      fields: [
        { name: "service", label: "Service", type: "text", placeholder: "checkout-api" },
        { name: "replicas", label: "Replicas", type: "number", placeholder: "4" },
      ],
    },
  ],
  mlops: [
    {
      id: "mlo_run_pipeline",
      label: "Trigger pipeline run",
      asset_type: "Pipeline",
      description: "Kick off an ad-hoc run of an ML pipeline.",
      guardrails: ["Compute quota check", "Schedule-conflict detection"],
      fields: [{ name: "pipeline", label: "Pipeline", type: "text", placeholder: "churn-training" }],
    },
    {
      id: "mlo_attach_drift",
      label: "Attach drift monitor",
      asset_type: "Drift monitor",
      description: "Attach a drift monitor to a serving endpoint.",
      guardrails: ["Compute quota check"],
      fields: [
        { name: "endpoint", label: "Endpoint", type: "text", placeholder: "churn-serving" },
        { name: "threshold", label: "Drift threshold", type: "number", placeholder: "0.6" },
      ],
    },
    {
      id: "mlo_retrain_rule",
      label: "Create retraining rule",
      asset_type: "Rule",
      description: "Create an auto-retraining rule bound to a drift signal.",
      guardrails: ["Compute quota check", "Schedule-conflict detection"],
      fields: [
        { name: "pipeline", label: "Pipeline", type: "text", placeholder: "churn-training" },
        { name: "trigger", label: "Trigger", type: "select", options: ["drift>0.60", "drift>0.75", "weekly"] },
      ],
    },
    {
      id: "mlo_gpu_alloc",
      label: "Adjust GPU allocation",
      asset_type: "Pipeline",
      description: "Change the GPU pool assigned to a pipeline.",
      guardrails: ["Compute quota check"],
      fields: [
        { name: "pipeline", label: "Pipeline", type: "text", placeholder: "ltv-training" },
        { name: "gpu", label: "GPU pool", type: "select", options: ["gpu-a100", "gpu-h100", "gpu-l4"] },
      ],
    },
    {
      id: "mlo_pause_schedule",
      label: "Pause / resume schedule",
      asset_type: "Schedule",
      description: "Pause or resume a pipeline's cron schedule.",
      guardrails: ["Schedule-conflict detection"],
      fields: [
        { name: "pipeline", label: "Pipeline", type: "text", placeholder: "churn-training" },
        { name: "state", label: "State", type: "select", options: ["pause", "resume"] },
      ],
    },
  ],
  security: [
    {
      id: "sec_deploy_policy",
      label: "Deploy OPA policy",
      asset_type: "Policy",
      description: "Apply an OPA/Rego policy to the cluster.",
      guardrails: ["Policy syntax validation + test-pass before cluster apply"],
      fields: [
        { name: "policy", label: "Policy", type: "text", placeholder: "require-resource-limits" },
        { name: "scope", label: "Scope", type: "select", options: ["namespace", "cluster", "org"] },
      ],
    },
    {
      id: "sec_revoke_access",
      label: "Revoke access",
      asset_type: "Access",
      description: "Revoke a principal's access to an asset.",
      guardrails: ["Policy syntax validation + test-pass before cluster apply"],
      fields: [
        { name: "principal", label: "Principal", type: "text", placeholder: "user@org.com" },
        { name: "asset", label: "Asset", type: "text", placeholder: "customer-churn-2026" },
      ],
    },
    {
      id: "sec_compliance_scan",
      label: "Run compliance scan",
      asset_type: "Scan",
      description: "Run a compliance scan across a scope.",
      guardrails: ["Policy syntax validation + test-pass before cluster apply"],
      fields: [
        { name: "scope", label: "Scope", type: "select", options: ["namespace", "cluster", "org"] },
      ],
    },
    {
      id: "sec_export_audit",
      label: "Export audit log",
      asset_type: "Audit log",
      description: "Export the audit log for a time window.",
      guardrails: ["Policy syntax validation + test-pass before cluster apply"],
      fields: [
        { name: "window", label: "Window", type: "select", options: ["24h", "7d", "30d", "90d"] },
      ],
    },
    {
      id: "sec_guardrail_org",
      label: "Enable guardrail org-wide",
      asset_type: "Guardrail",
      description: "Enable a guardrail policy across every namespace in the org.",
      guardrails: ["Policy syntax validation + test-pass before cluster apply"],
      fields: [{ name: "guardrail", label: "Guardrail", type: "text", placeholder: "block-privileged-pods" }],
    },
  ],
  "data-engineer": [
    {
      id: "de_run_pipeline",
      label: "Trigger pipeline run",
      asset_type: "Data pipeline",
      description: "Kick off an ad-hoc run of a data pipeline.",
      guardrails: ["DQ gate before publish", "PII flag notifies security"],
      fields: [{ name: "pipeline", label: "Pipeline", type: "text", placeholder: "orders_daily_agg" }],
    },
    {
      id: "de_publish_dataset",
      label: "Publish dataset",
      asset_type: "Dataset",
      description: "Publish a dataset version to consumers.",
      guardrails: ["DQ gate before publish", "PII flag notifies security"],
      fields: [
        { name: "dataset", label: "Dataset", type: "text", placeholder: "analytics.orders_daily" },
        { name: "version", label: "Version", type: "text", placeholder: "2026-07-03" },
      ],
    },
    {
      id: "de_refresh_fg",
      label: "Refresh feature group",
      asset_type: "Feature group",
      description: "Trigger an out-of-schedule refresh of a feature group.",
      guardrails: ["DQ gate before publish"],
      fields: [{ name: "feature_group", label: "Feature group", type: "text", placeholder: "customer_activity" }],
    },
    {
      id: "de_schema_change",
      label: "Request schema change",
      asset_type: "Dataset",
      description: "Propose a schema change to a published dataset.",
      guardrails: ["DQ gate before publish", "PII flag notifies security"],
      fields: [
        { name: "dataset", label: "Dataset", type: "text", placeholder: "analytics.orders_daily" },
        { name: "change", label: "Change", type: "text", placeholder: "add column region STRING" },
      ],
    },
    {
      id: "de_update_lineage",
      label: "Update lineage",
      asset_type: "Lineage",
      description: "Record a lineage edge between two assets.",
      guardrails: ["DQ gate before publish"],
      fields: [
        { name: "source", label: "Source", type: "text", placeholder: "orders_daily_agg" },
        { name: "target", label: "Target", type: "text", placeholder: "analytics.orders_daily" },
      ],
    },
  ],
};

export async function getActions(personaId: string): Promise<SelfServiceAction[]> {
  await delay();
  return ACTIONS[personaId] ?? [];
}

function findAction(actionId: string): SelfServiceAction | undefined {
  for (const list of Object.values(ACTIONS)) {
    const found = list.find((a) => a.id === actionId);
    if (found) return found;
  }
  return undefined;
}

export interface PreflightCheck {
  name: string;
  status: "pass" | "fail";
  reason?: string;
}

export async function runPreflight(
  actionId: string,
  _inputs: Record<string, string>
): Promise<{ checks: PreflightCheck[] }> {
  await delay();
  const action = findAction(actionId);
  const guardrails = action?.guardrails ?? [];
  const checks: PreflightCheck[] = guardrails.map((g, i) => {
    // For realism, flag the second guardrail (when present) as a soft failure.
    if (guardrails.length > 1 && i === 1) {
      return {
        name: g,
        status: "fail",
        reason: "Requires review before this action can proceed.",
      };
    }
    return { name: g, status: "pass" };
  });
  return { checks };
}

export async function executeAction(
  _actionId: string,
  _inputs: Record<string, string>
): Promise<{ status: string; pipeline_run_id?: string }> {
  await delay();
  return { status: "started", pipeline_run_id: uid("run") };
}
