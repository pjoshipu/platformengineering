import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SectionCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getCheckpoints,
  decideCheckpoint,
  getAgents,
  getMetrics,
  type Checkpoint,
  type Agent,
} from "./api";

const Autonomy = () => {
  const { data: metrics } = useMockQuery(getMetrics, []);
  const { data: agents } = useMockQuery(getAgents, []);
  const { data: checkpoints, loading, refetch } = useMockQuery(getCheckpoints, []);
  const [decided, setDecided] = useState<Record<string, string>>({});

  const decide = async (c: Checkpoint, decision: "Approved" | "Rejected") => {
    await decideCheckpoint(c.id, decision);
    setDecided((d) => ({ ...d, [c.id]: decision }));
    toast.success(`${decision}: ${c.action}`);
    refetch();
  };

  const budgetColumns: Column<Agent>[] = [
    { key: "name", header: "Agent", render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "autonomy", header: "Autonomy", render: (a) => <StatusBadge tone={a.autonomy === "High" ? "warning" : a.autonomy === "Medium" ? "info" : "neutral"}>{a.autonomy}</StatusBadge> },
    { key: "avg_steps", header: "Avg steps / cap", render: (a) => `${a.avg_steps} / ${a.avg_steps + 6}` },
    { key: "cost_day", header: "Cost/day", align: "right", render: (a) => `$${a.cost_day.toFixed(2)}` },
    {
      key: "actions",
      header: "",
      render: (a) => <Button variant="ghost" size="sm" onClick={() => toast(`Edit autonomy policy for ${a.name}`)}>Edit policy</Button>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Autonomy & Checkpoints"
        description="Approve human-in-the-loop checkpoints and manage each agent's autonomy budget."
      />

      <MetricsRow>
        <MetricCard label="Pending checkpoints" value={checkpoints?.length ?? "—"} tone={checkpoints && checkpoints.length > 0 ? "warning" : "good"} />
        <MetricCard label="Autonomy budget used" value={metrics ? `${metrics.autonomy_budget_used}%` : "—"} tone={metrics && metrics.autonomy_budget_used > 80 ? "poor" : "default"} />
        <MetricCard label="Active runs" value={metrics?.active_runs ?? "—"} tone="highlight" />
        <MetricCard label="Spend today" value={metrics ? `$${metrics.today_cost}` : "—"} />
      </MetricsRow>

      <div className="mt-6">
        <Progress value={metrics?.autonomy_budget_used ?? 0} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">Daily autonomy budget consumption across all agents.</p>
      </div>

      <SectionCard title="Pending approvals" className="mt-8">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && (checkpoints ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No checkpoints awaiting approval.</p>
        )}
        <div className="space-y-2">
          {(checkpoints ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.agent_name}</span>
                  <StatusBadge tone={c.risk === "High" ? "danger" : c.risk === "Medium" ? "warning" : "neutral"}>{c.risk} risk</StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{c.action}</p>
                <span className="text-[10px] text-muted-foreground">run {c.run_id} · {timeAgo(c.requested_at)}</span>
              </div>
              {decided[c.id] ? (
                <StatusBadge tone={decided[c.id] === "Approved" ? "success" : "danger"}>{decided[c.id]}</StatusBadge>
              ) : (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => decide(c, "Rejected")}>Reject</Button>
                  <Button size="sm" onClick={() => decide(c, "Approved")}>Approve</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Autonomy budgets</h2>
        <DataTable columns={budgetColumns} rows={agents ?? []} rowKey={(a) => a.id} />
      </div>
    </div>
  );
};

export default Autonomy;
