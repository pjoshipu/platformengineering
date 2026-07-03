import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Workflow, XCircle, Database, AlertTriangle } from "lucide-react";
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
import { getPipelines, getMetrics, getQualityAlerts, type Pipeline } from "./api";

const DataEngineerDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetrics, []);
  const { data: pipelines, loading, refetch } = useMockQuery(getPipelines, []);
  const { data: alerts } = useMockQuery(getQualityAlerts, []);

  const columns: Column<Pipeline>[] = [
    { key: "name", header: "Pipeline", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "schedule", header: "Schedule", render: (p) => <span className="font-mono text-xs">{p.schedule}</span> },
    { key: "last_run", header: "Last run", sortable: true, accessor: (p) => p.last_run, render: (p) => timeAgo(p.last_run) },
    { key: "duration_min", header: "Duration", sortable: true, render: (p) => `${p.duration_min}m` },
    { key: "status", header: "Status", render: (p) => <StatusBadge>{p.status}</StatusBadge> },
    { key: "output_dataset", header: "Output dataset", render: (p) => <span className="font-mono text-xs">{p.output_dataset}</span> },
    {
      key: "quality_score",
      header: "Quality",
      sortable: true,
      render: (p) => (
        <span className={p.quality_score < 80 ? "text-destructive font-medium" : p.quality_score < 90 ? "text-yellow-600 font-medium" : "font-medium"}>
          {p.quality_score}%
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              toast.success(`Triggered ${p.name}`);
              refetch();
            }}
          >
            Trigger now
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Logs for ${p.name}`)}>View logs</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/idp/data-engineer/lineage")}>View lineage</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/idp/data-engineer/pipelines")}>Edit</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Data Engineer Dashboard"
        description="Health of your data pipelines, data quality alerts, feature store freshness, and dataset usage."
        actions={<Button onClick={() => navigate("/idp/data-engineer/pipelines")}>New pipeline</Button>}
      />

      <MetricsRow>
        <MetricCard label="Pipelines running" value={metrics?.running_pipelines ?? "—"} icon={Workflow} tone="highlight" />
        <MetricCard
          label="Failed runs today"
          value={metrics?.failed_today ?? "—"}
          icon={XCircle}
          tone={metrics && metrics.failed_today > 0 ? "poor" : "good"}
        />
        <MetricCard label="Datasets published" value={metrics?.datasets_published ?? "—"} icon={Database} />
        <MetricCard
          label="Data quality alerts"
          value={metrics?.quality_alerts ?? "—"}
          icon={AlertTriangle}
          tone={metrics && metrics.quality_alerts > 0 ? "warning" : "good"}
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">Pipeline status</h2>
          <DataTable
            columns={columns}
            rows={pipelines ?? []}
            rowKey={(p) => p.id}
            loading={loading}
            onRowClick={() => navigate("/idp/data-engineer/pipelines")}
            defaultSort={{ key: "status", dir: "desc" }}
          />
        </div>

        <SidePanel title="Data quality alerts">
          {(alerts ?? []).length === 0 && <div className="text-sm text-muted-foreground">No active alerts.</div>}
          {(alerts ?? []).map((a, i) => (
            <div key={i} className="rounded-lg border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs truncate">{a.dataset_id}</div>
                <StatusBadge>{a.severity}</StatusBadge>
              </div>
              <div className="mt-1 text-sm font-medium">{a.check_name}</div>
              <div className="text-xs text-muted-foreground">
                {a.failed_rows.toLocaleString()} failed rows · {timeAgo(a.created_at)}
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-1" onClick={() => navigate("/idp/data-engineer/quality")}>
            View all checks
          </Button>
        </SidePanel>
      </div>
    </div>
  );
};

export default DataEngineerDashboard;
