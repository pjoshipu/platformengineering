import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Boxes, GitCompare, DollarSign, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SidePanel,
  SideDrawer,
  SectionCard,
  InfoList,
  Field,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getApps,
  getIncidents,
  getMetricsSummary,
  rollbackApp,
  type LlmApp,
  type Incident,
} from "./api";

const faithfulnessTone = (f: number) => (f >= 0.9 ? "good" : f >= 0.8 ? "warning" : "poor");
const fmtPct = (f: number) => `${(f * 100).toFixed(0)}%`;

const AiEngineerDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetricsSummary, []);
  const { data: apps, loading, refetch } = useMockQuery(getApps, []);
  const { data: incidents } = useMockQuery(getIncidents, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");

  const [pipelineApp, setPipelineApp] = useState<LlmApp | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<LlmApp | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState("");

  const allApps = apps ?? [];
  const types = useMemo(() => Array.from(new Set(allApps.map((a) => a.type))), [allApps]);
  const providers = useMemo(() => Array.from(new Set(allApps.map((a) => a.provider))), [allApps]);

  const rows = allApps.filter(
    (a) =>
      (statusFilter === "all" || a.status === statusFilter) &&
      (typeFilter === "all" || a.type === typeFilter) &&
      (providerFilter === "all" || a.provider === providerFilter)
  );

  const costDelta = metrics ? metrics.today_cost - metrics.yesterday_cost : 0;

  const columns: Column<LlmApp>[] = [
    { key: "name", header: "App", render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "type", header: "Type" },
    { key: "model", header: "Model", render: (a) => <span className="font-mono text-xs">{a.model}</span> },
    { key: "version", header: "Version", render: (a) => <span className="font-mono text-xs">{a.version}</span> },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    {
      key: "faithfulness",
      header: "Faithfulness",
      sortable: true,
      align: "right",
      accessor: (a) => a.faithfulness,
      render: (a) => (
        <span className={faithfulnessTone(a.faithfulness) === "good" ? "text-green-600" : faithfulnessTone(a.faithfulness) === "warning" ? "text-yellow-600" : "text-destructive"}>
          {fmtPct(a.faithfulness)}
        </span>
      ),
    },
    { key: "p95_latency", header: "p95 Latency", sortable: true, align: "right", accessor: (a) => a.p95_latency, render: (a) => `${a.p95_latency}ms` },
    { key: "cost_day", header: "Cost/day", sortable: true, align: "right", accessor: (a) => a.cost_day, render: (a) => `$${a.cost_day.toFixed(2)}` },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setPipelineApp(a)}>View pipeline</Button>
          <Button variant="ghost" size="sm" onClick={() => { setRollbackTarget(a); setRollbackVersion(""); }}>Rollback</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/ai-engineer/observe/${a.id}`)}>View logs</Button>
        </div>
      ),
    },
  ];

  const selectClass = "w-[150px]";
  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className={selectClass}><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {["Healthy", "Degraded", "Canary", "Rolled back"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className={selectClass}><SelectValue placeholder="App type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={providerFilter} onValueChange={setProviderFilter}>
        <SelectTrigger className={selectClass}><SelectValue placeholder="Provider" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All providers</SelectItem>
          {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const doRollback = async () => {
    if (!rollbackTarget || !rollbackVersion) {
      toast.error("Select a version to roll back to");
      return;
    }
    await rollbackApp(rollbackTarget.id, rollbackVersion);
    toast.success(`Rolling ${rollbackTarget.name} back to ${rollbackVersion}`);
    setRollbackTarget(null);
    refetch();
  };

  const rollbackVersions = ["v1.3.0", "v1.2.0", "v1.1.0"];

  return (
    <div>
      <PageHeader
        title="AI Engineer Dashboard"
        description="Health of your deployed LLM applications, active canaries, cost, and quality."
        actions={<Button onClick={() => navigate("/ai-engineer/deploy")}>Deploy LLM App</Button>}
      />

      <MetricsRow>
        <MetricCard label="LLM apps deployed" value={metrics?.total_apps ?? "—"} icon={Boxes} />
        <MetricCard
          label="Active canaries"
          value={metrics?.active_canaries ?? "—"}
          icon={GitCompare}
          tone="highlight"
          onClick={() => navigate("/ai-engineer/canary")}
          actionLabel="View"
        />
        <MetricCard
          label="Today's LLM cost"
          value={metrics ? `$${metrics.today_cost.toFixed(2)}` : "—"}
          icon={DollarSign}
          delta={metrics ? `$${Math.abs(costDelta).toFixed(2)}` : undefined}
          deltaPositive={costDelta <= 0}
          footer="vs yesterday"
        />
        <MetricCard
          label="Avg faithfulness"
          value={metrics ? fmtPct(metrics.avg_faithfulness) : "—"}
          icon={Gauge}
          tone={metrics ? faithfulnessTone(metrics.avg_faithfulness) : "default"}
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">LLM applications</h2>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(a) => a.id}
            loading={loading}
            toolbar={toolbar}
            defaultSort={{ key: "cost_day", dir: "desc" }}
            onRowClick={(a) => navigate(`/ai-engineer/observe/${a.id}`)}
          />
        </div>

        <SidePanel title="Active incidents">
          {(incidents ?? []).length === 0 && <p className="text-sm text-muted-foreground">No open incidents.</p>}
          {(incidents ?? []).map((inc: Incident) => (
            <div key={inc.id} className="rounded-lg border border-border p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <StatusBadge tone={inc.severity === "P1" ? "danger" : inc.severity === "P2" ? "info" : "warning"}>{inc.severity}</StatusBadge>
                <span className="text-xs text-muted-foreground">{timeAgo(inc.created_at)}</span>
              </div>
              <div className="text-sm font-medium leading-snug">{inc.title}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{inc.app_name}</span>
                <button className="text-xs font-medium text-primary" onClick={() => navigate(`/ai-engineer/observe/${inc.app_id}`)}>
                  Investigate →
                </button>
              </div>
            </div>
          ))}
        </SidePanel>
      </div>

      {/* Pipeline side drawer */}
      <SideDrawer
        open={!!pipelineApp}
        onOpenChange={(o) => !o && setPipelineApp(null)}
        title={pipelineApp ? `${pipelineApp.name} pipeline` : ""}
        description={pipelineApp ? `${pipelineApp.type} · ${pipelineApp.model}` : undefined}
        wide
      >
        {pipelineApp && (
          <>
            <SectionCard title="Deployment">
              <InfoList
                items={[
                  { label: "Current version", value: <span className="font-mono text-xs">{pipelineApp.version}</span> },
                  { label: "Status", value: <StatusBadge>{pipelineApp.status}</StatusBadge> },
                  { label: "Model", value: <span className="font-mono text-xs">{pipelineApp.model}</span> },
                  { label: "Provider", value: pipelineApp.provider },
                ]}
              />
            </SectionCard>
            <SectionCard title="Pipeline stages">
              <ol className="space-y-2 text-sm">
                {["Prompt registry", "Guardrails", "Eval gate", "Canary", "Prod"].map((stage, i) => (
                  <li key={stage} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs">{i + 1}</span>
                    {stage}
                    {i < 4 && <StatusBadge tone="success">passed</StatusBadge>}
                  </li>
                ))}
              </ol>
            </SectionCard>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { navigate(`/ai-engineer/prompts/${pipelineApp.id}`); }}>Prompt registry</Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate(`/ai-engineer/observe/${pipelineApp.id}`)}>Observability</Button>
            </div>
          </>
        )}
      </SideDrawer>

      {/* Rollback confirmation modal */}
      <Dialog open={!!rollbackTarget} onOpenChange={(o) => !o && setRollbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Roll back {rollbackTarget?.name}?</DialogTitle>
            <DialogDescription>
              This routes 100% of traffic back to a previous version. Current prod is{" "}
              <span className="font-mono">{rollbackTarget?.version}</span>.
            </DialogDescription>
          </DialogHeader>
          <Field label="Roll back to version" required>
            <Select value={rollbackVersion} onValueChange={setRollbackVersion}>
              <SelectTrigger><SelectValue placeholder="Select version…" /></SelectTrigger>
              <SelectContent>
                {rollbackVersions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRollbackTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doRollback}>Confirm rollback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiEngineerDashboard;
