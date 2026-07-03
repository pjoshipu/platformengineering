import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Bot, Activity, ShieldQuestion, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SidePanel,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getAgents, getMetrics, getCheckpoints, type Agent } from "./api";

const AgenticDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetrics, []);
  const { data: agents, loading } = useMockQuery(getAgents, []);
  const { data: checkpoints } = useMockQuery(getCheckpoints, []);

  const columns: Column<Agent>[] = [
    { key: "name", header: "Agent", sortable: true, render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "runtime", header: "Runtime", render: (a) => <span className="text-xs">{a.runtime}</span> },
    { key: "model", header: "Model", render: (a) => <span className="font-mono text-xs">{a.model}</span> },
    { key: "tools", header: "Tools", align: "right" },
    { key: "autonomy", header: "Autonomy", render: (a) => <StatusBadge tone={a.autonomy === "High" ? "warning" : a.autonomy === "Medium" ? "info" : "neutral"}>{a.autonomy}</StatusBadge> },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    { key: "success_rate", header: "Success", sortable: true, accessor: (a) => a.success_rate, render: (a) => `${(a.success_rate * 100).toFixed(0)}%` },
    { key: "cost_day", header: "Cost/day", sortable: true, accessor: (a) => a.cost_day, render: (a) => `$${a.cost_day.toFixed(2)}` },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/idp/agentic-engineer/runs")}>Runs</Button>
          <Button variant="ghost" size="sm" onClick={() => toast(a.status === "Paused" ? `Resuming ${a.name}` : `Pausing ${a.name}`)}>
            {a.status === "Paused" ? "Resume" : "Pause"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Agentic Engineer Dashboard"
        description="Your autonomous agents, their live runs, autonomy budget, and human-in-the-loop checkpoints."
        actions={<Button onClick={() => navigate("/idp/agentic-engineer/deploy")}>Deploy Agent</Button>}
      />

      <MetricsRow>
        <MetricCard label="Agents deployed" value={metrics?.total_agents ?? "—"} icon={Bot} />
        <MetricCard label="Active runs" value={metrics?.active_runs ?? "—"} icon={Activity} tone="highlight" />
        <MetricCard
          label="Pending checkpoints"
          value={metrics?.pending_checkpoints ?? "—"}
          icon={ShieldQuestion}
          tone={metrics && metrics.pending_checkpoints > 0 ? "warning" : "good"}
          onClick={() => navigate("/idp/agentic-engineer/autonomy")}
          actionLabel="review"
        />
        <MetricCard
          label="Autonomy budget used"
          value={metrics ? `${metrics.autonomy_budget_used}%` : "—"}
          icon={DollarSign}
          tone={metrics && metrics.autonomy_budget_used > 80 ? "poor" : "default"}
          footer={metrics ? `$${metrics.today_cost}/day` : undefined}
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">Agents</h2>
          <DataTable
            columns={columns}
            rows={agents ?? []}
            rowKey={(a) => a.id}
            loading={loading}
            onRowClick={() => navigate("/idp/agentic-engineer/agents")}
          />
        </div>

        <SidePanel title="Pending checkpoints">
          {(checkpoints ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nothing awaiting approval.</p>}
          {(checkpoints ?? []).map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{c.agent_name}</span>
                <StatusBadge tone={c.risk === "High" ? "danger" : c.risk === "Medium" ? "warning" : "neutral"}>{c.risk}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.action}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{timeAgo(c.requested_at)}</span>
                <button className="text-xs font-medium text-primary" onClick={() => navigate("/idp/agentic-engineer/autonomy")}>
                  Review →
                </button>
              </div>
            </div>
          ))}
        </SidePanel>
      </div>
    </div>
  );
};

export default AgenticDashboard;
