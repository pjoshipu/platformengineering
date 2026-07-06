import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Activity, AlertTriangle, RefreshCw, Cpu } from "lucide-react";
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
import {
  getMetrics,
  getPipelines,
  getDriftAlerts,
  triggerRetraining,
  type Pipeline,
} from "./api";

const gpuTone = (v?: number) =>
  v == null ? "default" : v >= 85 ? "poor" : v >= 65 ? "warning" : "good";

const MlopsDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetrics, []);
  const { data: pipelines, loading, refetch } = useMockQuery(getPipelines, []);
  const { data: alerts } = useMockQuery(getDriftAlerts, []);

  const columns: Column<Pipeline>[] = [
    { key: "name", header: "Pipeline", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "last_run", header: "Last run", sortable: true, accessor: (p) => p.last_run, render: (p) => timeAgo(p.last_run) },
    { key: "duration_min", header: "Duration", sortable: true, render: (p) => `${p.duration_min}m` },
    { key: "status", header: "Status", render: (p) => <StatusBadge>{p.status}</StatusBadge> },
    { key: "next_run", header: "Next run", render: (p) => `in ${timeAgo(p.next_run).replace(" ago", "")}` },
    { key: "model_name", header: "Model served", render: (p) => <span className="font-mono text-xs">{p.model_name}</span> },
    { key: "drift_status", header: "Drift", render: (p) => <StatusBadge>{p.drift_status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await triggerRetraining(p.model_id);
              toast.success(`Triggered ${p.name}`);
              refetch();
            }}
          >
            Trigger now
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/mlops/pipelines")}>View runs</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/mlops/drift/${p.model_id}`)}>Drift report</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/mlops/retraining-rules")}>Edit schedule</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="MLOps Dashboard"
        description="Operational health of ML pipelines, drift alerts, scheduled retraining, and infra usage."
        actions={<Button onClick={() => navigate("/mlops/pipelines")}>Pipeline Monitor</Button>}
      />

      <MetricsRow>
        <MetricCard
          label="Pipelines healthy"
          value={metrics ? `${metrics.healthy_pipelines} / ${metrics.total_pipelines}` : "—"}
          icon={Activity}
          tone={metrics && metrics.healthy_pipelines < metrics.total_pipelines ? "warning" : "good"}
        />
        <MetricCard
          label="Active drift alerts"
          value={metrics?.drift_alerts ?? "—"}
          icon={AlertTriangle}
          tone={metrics && metrics.drift_alerts > 0 ? "poor" : "good"}
        />
        <MetricCard label="Retraining jobs today" value={metrics?.retraining_today ?? "—"} icon={RefreshCw} tone="highlight" />
        <MetricCard
          label="GPU utilisation"
          value={metrics ? `${metrics.gpu_utilisation}%` : "—"}
          icon={Cpu}
          tone={gpuTone(metrics?.gpu_utilisation)}
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">Pipeline health</h2>
          <DataTable
            columns={columns}
            rows={pipelines ?? []}
            rowKey={(p) => p.id}
            loading={loading}
            onRowClick={(p) => navigate(`/mlops/drift/${p.model_id}`)}
          />
        </div>

        <SidePanel title="Drift alerts">
          {(alerts ?? []).length === 0 && (
            <div className="text-sm text-muted-foreground">No active drift alerts.</div>
          )}
          {(alerts ?? []).map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{a.model_name}</span>
                <StatusBadge>{a.severity}</StatusBadge>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{a.feature}</span> · score {a.drift_score.toFixed(2)} · {timeAgo(a.created_at)}
              </div>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => navigate(`/mlops/drift/${a.model_id}`)}
              >
                Investigate
              </Button>
            </div>
          ))}
        </SidePanel>
      </div>
    </div>
  );
};

export default MlopsDashboard;
