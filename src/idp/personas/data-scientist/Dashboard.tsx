import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Activity, FlaskConical, Boxes, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  type Column,
} from "@/idp/components";
import { LineChartCard } from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getTrainingJobs,
  getExperimentsSummary,
  getMetricsSummary,
  getRunDetail,
  submitForApproval,
  type TrainingJob,
} from "./api";

const RuntimeCell = ({ job }: { job: TrainingJob }) =>
  job.status === "Running" ? (
    <span className="inline-flex items-center gap-1.5 text-primary">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {job.runtime_min}m
    </span>
  ) : (
    <span>{job.runtime_min ? `${job.runtime_min}m` : "—"}</span>
  );

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetricsSummary, []);
  const { data: jobs, loading, refetch } = useMockQuery(getTrainingJobs, []);
  const { data: experiments } = useMockQuery(() => getExperimentsSummary(5), []);
  const [selected, setSelected] = useState<TrainingJob | null>(null);

  const { data: detail } = useMockQuery(
    () =>
      selected ? getRunDetail("exp_churn", "exp_churn-run-1") : Promise.resolve(undefined),
    [selected?.id]
  );

  const columns: Column<TrainingJob>[] = [
    { key: "name", header: "Job name", sortable: true, render: (j) => <span className="font-medium">{j.name}</span> },
    { key: "model_type", header: "Model type" },
    { key: "dataset", header: "Dataset", render: (j) => <span className="font-mono text-xs">{j.dataset}</span> },
    { key: "status", header: "Status", render: (j) => <StatusBadge>{j.status}</StatusBadge> },
    { key: "started_at", header: "Started", sortable: true, accessor: (j) => j.started_at, render: (j) => timeAgo(j.started_at) },
    { key: "runtime_min", header: "Runtime", sortable: true, render: (j) => <RuntimeCell job={j} /> },
    { key: "best_metric", header: "Best metric", sortable: true, render: (j) => (j.best_metric ? j.best_metric.toFixed(3) : "—") },
    {
      key: "actions",
      header: "Actions",
      render: (j) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(j)}>Logs</Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(j)}>Metrics</Button>
          {(j.status === "Complete" || j.status === "Pending approval") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await submitForApproval(j.id);
                toast.success(`Submitted ${j.name} for approval`);
              }}
            >
              Submit
            </Button>
          )}
          {(j.status === "Running" || j.status === "Queued") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                toast.success(`Cancelling ${j.name}`);
                refetch();
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Data Scientist Dashboard"
        description="Active training jobs, recent experiments, pending approvals, and dataset usage."
        actions={<Button onClick={() => navigate("/idp/data-scientist/request")}>New Training Request</Button>}
      />

      <MetricsRow>
        <MetricCard label="Active training jobs" value={metrics?.active_jobs ?? "—"} icon={Activity} tone="highlight" />
        <MetricCard label="Experiments this week" value={metrics?.experiments_week ?? "—"} icon={FlaskConical} />
        <MetricCard label="Models in registry" value={metrics?.models_count ?? "—"} icon={Boxes} />
        <MetricCard
          label="Pending approvals"
          value={metrics?.pending_approvals ?? "—"}
          icon={CheckSquare}
          tone={metrics && metrics.pending_approvals > 0 ? "warning" : "good"}
          onClick={() => navigate("/idp/data-scientist/approvals")}
          actionLabel="Review"
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">My jobs</h2>
          <DataTable
            columns={columns}
            rows={jobs ?? []}
            rowKey={(j) => j.id}
            loading={loading}
            onRowClick={(j) => setSelected(j)}
            defaultSort={{ key: "started_at", dir: "desc" }}
          />
        </div>

        <SidePanel title="Recent experiments">
          {(experiments ?? []).map((e) => (
            <div key={e.id} className="rounded-lg border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{e.name}</span>
                <span className="text-xs text-muted-foreground">{e.run_count} runs</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>AUC {e.best_auc.toFixed(3)} · F1 {e.best_f1.toFixed(3)}</span>
                <span>{timeAgo(e.date)}</span>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={() => navigate("/idp/data-scientist/experiments")}
          >
            View all
          </Button>
        </SidePanel>
      </div>

      {/* Job detail drawer: logs + metrics */}
      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.model_type} · ${selected.dataset}` : undefined}
        wide
      >
        {selected && detail && (
          <>
            <SectionCard title="Summary">
              <InfoList
                items={[
                  { label: "Status", value: <StatusBadge>{selected.status}</StatusBadge> },
                  { label: "Framework", value: detail.framework },
                  { label: "Compute", value: detail.compute },
                  { label: "Runtime", value: `${selected.runtime_min}m` },
                  { label: "Best metric", value: selected.best_metric ? selected.best_metric.toFixed(3) : "—" },
                ]}
              />
            </SectionCard>
            <div className="mt-4">
              <LineChartCard
                title="Metric over epochs (AUC-ROC)"
                data={detail.metric_curve}
                series={[{ key: "auc", label: "AUC-ROC" }]}
                height={200}
              />
            </div>
            <div className="mt-4">
              <LineChartCard
                title="Loss over epochs"
                data={detail.loss_curve}
                series={[
                  { key: "train", label: "Train" },
                  { key: "val", label: "Validation" },
                ]}
                height={200}
              />
            </div>
            <SectionCard title="Logs" className="mt-4">
              <pre className="font-mono text-xs whitespace-pre-wrap text-muted-foreground">{detail.logs}</pre>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Dashboard;
