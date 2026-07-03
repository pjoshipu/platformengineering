import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Star,
  ArrowLeft,
  Rocket,
  Code2,
  Database,
  Server,
  ShieldCheck,
  Activity,
  MessagesSquare,
  DollarSign,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import {
  DataTable,
  StatusBadge,
  SectionCard,
  InfoList,
  EmptyState,
  Field,
  type Column,
  type Tone,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAgent,
  getAgentExecutions,
  deployAgent,
  type Agent,
  type AgentInput,
  type AgentTool,
  type AgentExecution,
  type Category,
  type PermissionScope,
} from "./api";

/**
 * IDP Agent Marketplace — Screen 2: Agent Detail (route agents/:agentId).
 * Header + tabbed detail (Overview / Inputs / Tools / Safety / Executions)
 * with a "Deploy to pipeline" dialog. All data comes from the mock api.ts.
 */

const CATEGORY_ICON: Record<Category, LucideIcon> = {
  "Code & Testing": Code2,
  "Data & ML": Database,
  Infrastructure: Server,
  Security: ShieldCheck,
  Observability: Activity,
  Collaboration: MessagesSquare,
  Cost: DollarSign,
};

const PERMISSION_TONE: Record<PermissionScope, Tone> = {
  "Read-only": "neutral",
  Write: "warning",
  Scoped: "info",
  Sandboxed: "active",
};

const AgentDetail = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const persona = user?.persona ?? "";
  const backLink = `/idp/${persona}/agents`;

  const { data: agent, loading } = useMockQuery(
    () => (agentId ? getAgent(agentId) : Promise.resolve(undefined)),
    [agentId]
  );

  const { data: executions } = useMockQuery(
    () => (agentId ? getAgentExecutions(agentId) : Promise.resolve<AgentExecution[]>([])),
    [agentId]
  );

  const [deployOpen, setDeployOpen] = useState(false);

  if (loading) {
    return (
      <div>
        <BackLink to={backLink} />
        <div className="py-12 text-center text-muted-foreground text-sm">Loading agent…</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div>
        <BackLink to={backLink} />
        <EmptyState
          title="Agent not found"
          description="This agent does not exist or is no longer available in the marketplace."
          action={
            <Button variant="outline" onClick={() => navigate(backLink)}>
              Back to marketplace
            </Button>
          }
        />
      </div>
    );
  }

  const Icon = CATEGORY_ICON[agent.category] ?? Server;

  return (
    <div>
      <BackLink to={backLink} />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 shrink-0">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <StatusBadge>{agent.status}</StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1">
              by {agent.author} · {agent.version}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <StatusBadge tone="neutral">{agent.scope}</StatusBadge>
              <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <Star className="w-4 h-4 fill-current" />
                {agent.rating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                {agent.use_count.toLocaleString()} uses
              </span>
              <span className="text-muted-foreground">{agent.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => toast("Opening source repository (coming soon)")}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            View source
          </Button>
          <Button onClick={() => setDeployOpen(true)}>
            <Rocket className="w-4 h-4 mr-1.5" />
            Deploy to pipeline
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inputs">Inputs</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab agent={agent} />
        </TabsContent>

        <TabsContent value="inputs" className="mt-4">
          <InputsTab inputs={agent.inputs} />
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <ToolsTab tools={agent.tools} />
        </TabsContent>

        <TabsContent value="safety" className="mt-4">
          <SafetyTab agent={agent} />
        </TabsContent>

        <TabsContent value="executions" className="mt-4">
          <ExecutionsTab executions={executions ?? []} />
        </TabsContent>
      </Tabs>

      <DeployDialog
        agent={agent}
        open={deployOpen}
        onOpenChange={setDeployOpen}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */

const BackLink = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to marketplace
    </button>
  );
};

/* ----------------------------- Overview ----------------------------- */

const OverviewTab = ({ agent }: { agent: Agent }) => (
  <div className="space-y-4">
    <SectionCard title="Description">
      <p className="text-sm text-muted-foreground leading-relaxed">{agent.description_full}</p>
    </SectionCard>

    <SectionCard title="What this agent does">
      <ol className="space-y-2">
        {agent.steps_explanation.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            <span className="text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </SectionCard>

    <SectionCard title="Trigger">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge tone="info">{agent.trigger.type}</StatusBadge>
        <span className="text-muted-foreground">{agent.trigger.config}</span>
      </div>
    </SectionCard>

    <SectionCard title="Prerequisites">
      <ul className="space-y-1.5">
        {agent.prerequisites.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  </div>
);

/* ------------------------------ Inputs ------------------------------ */

const InputsTab = ({ inputs }: { inputs: AgentInput[] }) => {
  const columns: Column<AgentInput>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-mono text-xs font-medium">{r.name}</span> },
    { key: "type", header: "Type", render: (r) => <span className="font-mono text-xs">{r.type}</span> },
    {
      key: "required",
      header: "Required",
      render: (r) => <StatusBadge tone={r.required ? "warning" : "neutral"}>{r.required ? "Required" : "Optional"}</StatusBadge>,
    },
    { key: "default", header: "Default", render: (r) => <span className="font-mono text-xs">{r.default ?? "—"}</span> },
    { key: "source", header: "Source", render: (r) => <span className="text-sm">{r.source}</span> },
    { key: "description", header: "Description", render: (r) => <span className="text-sm text-muted-foreground">{r.description}</span> },
  ];
  return (
    <DataTable
      columns={columns}
      rows={inputs}
      rowKey={(r) => r.name}
      emptyTitle="No inputs"
      emptyDescription="This agent takes no configurable inputs."
    />
  );
};

/* ------------------------------- Tools ------------------------------ */

const ToolsTab = ({ tools }: { tools: AgentTool[] }) => {
  const columns: Column<AgentTool>[] = [
    { key: "name", header: "Tool", render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "permission_scope",
      header: "Permission",
      render: (r) => <StatusBadge tone={PERMISSION_TONE[r.permission_scope] ?? "neutral"}>{r.permission_scope}</StatusBadge>,
    },
    { key: "description", header: "Description", render: (r) => <span className="text-sm text-muted-foreground">{r.description}</span> },
  ];
  return (
    <DataTable
      columns={columns}
      rows={tools}
      rowKey={(r) => r.name}
      emptyTitle="No tools"
      emptyDescription="This agent has no registered tools."
    />
  );
};

/* ------------------------------ Safety ------------------------------ */

const SafetyTab = ({ agent }: { agent: Agent }) => {
  const s = agent.safety;
  const hc = s.human_checkpoint;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Execution limits">
        <InfoList
          items={[
            { label: "Max steps", value: s.max_steps },
            { label: "Cost cap", value: `$${s.cost_cap_usd.toFixed(2)}` },
            {
              label: "Rollback on failure",
              value: (
                <StatusBadge tone={s.rollback_on_failure ? "success" : "neutral"}>
                  {s.rollback_on_failure ? "Enabled" : "Disabled"}
                </StatusBadge>
              ),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Human checkpoint">
        {hc.enabled ? (
          <InfoList
            items={[
              { label: "Status", value: <StatusBadge tone="active">Enabled</StatusBadge> },
              { label: "At step", value: hc.at_step ?? "—" },
              { label: "Reviewer prompt", value: hc.reviewer_prompt ?? "—" },
            ]}
          />
        ) : (
          <InfoList items={[{ label: "Status", value: <StatusBadge tone="neutral">Not required</StatusBadge> }]} />
        )}
      </SectionCard>

      <SectionCard title="Blocked actions" className="md:col-span-2">
        {s.blocked_actions.length ? (
          <ul className="space-y-1.5">
            {s.blocked_actions.map((b, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-destructive">✕</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No explicitly blocked actions configured.</p>
        )}
      </SectionCard>
    </div>
  );
};

/* ---------------------------- Executions ---------------------------- */

const ExecutionsTab = ({ executions }: { executions: AgentExecution[] }) => {
  const columns: Column<AgentExecution>[] = [
    { key: "run_id", header: "Run ID", render: (r) => <span className="font-mono text-xs">{r.run_id}</span> },
    { key: "triggered_by", header: "Triggered by", render: (r) => <span className="text-sm">{r.triggered_by}</span> },
    { key: "started", header: "Started", accessor: (r) => r.started, render: (r) => timeAgo(r.started) },
    { key: "duration", header: "Duration", render: (r) => <span className="font-mono text-xs">{r.duration}</span> },
    { key: "steps", header: "Steps", align: "right", render: (r) => r.steps },
    { key: "cost", header: "Cost", align: "right", render: (r) => `$${r.cost.toFixed(2)}` },
    { key: "outcome", header: "Outcome", render: (r) => <StatusBadge>{r.outcome}</StatusBadge> },
    {
      key: "trace",
      header: "Trace",
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => toast(`Opening trace for ${r.run_id} (coming soon)`)}>
          View
        </Button>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={executions}
      rowKey={(r) => r.run_id}
      emptyTitle="No executions yet"
      emptyDescription="This agent has not been run."
    />
  );
};

/* ----------------------------- Deploy ------------------------------- */

const DeployDialog = ({
  agent,
  open,
  onOpenChange,
}: {
  agent: Agent;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) => {
  const [pipelineId, setPipelineId] = useState("");
  const [environment, setEnvironment] = useState("Dev");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { deployment_id } = await deployAgent(agent.id, {
        pipeline_id: pipelineId.trim() || undefined,
        environment,
      });
      toast.success(`${agent.name} deployed`, {
        description: `Deployment ${deployment_id} to ${environment}.`,
      });
      onOpenChange(false);
      setPipelineId("");
      setEnvironment("Dev");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deploy {agent.name} to pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Pipeline ID" htmlFor="pipeline-id">
            <Input
              id="pipeline-id"
              value={pipelineId}
              onChange={(e) => setPipelineId(e.target.value)}
              placeholder="build-prod"
              className="font-mono text-sm"
            />
          </Field>
          <Field label="Environment">
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dev">Dev</SelectItem>
                <SelectItem value="Staging">Staging</SelectItem>
                <SelectItem value="Prod">Prod</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            <Rocket className="w-4 h-4 mr-1.5" />
            {submitting ? "Deploying…" : "Deploy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentDetail;
