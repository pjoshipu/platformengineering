import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  LineChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getExperiments,
  getExperimentRuns,
  getRunDetail,
  promoteRun,
  type ExperimentRun,
} from "./api";

const Experiments = () => {
  const { data: experiments } = useMockQuery(getExperiments, []);
  const exps = experiments ?? [];
  const [expId, setExpId] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // When "all" is selected we merge runs from the first few experiments.
  const activeExpIds = expId === "all" ? exps.map((e) => e.id) : [expId];
  const { data: runData, loading } = useMockQuery(async () => {
    const lists = await Promise.all(activeExpIds.map((id) => getExperimentRuns(id)));
    return lists.flat();
  }, [expId, exps.length]);

  const runs = (runData ?? []).filter(
    (r) => statusFilter === "all" || r.status === statusFilter
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const selectedRuns = runs.filter((r) => checked[r.run_id]);

  const [detailRunId, setDetailRunId] = useState<string | null>(null);
  const detailExpId = detailRunId ? detailRunId.split("-run-")[0] : null;
  const { data: detail } = useMockQuery(
    () =>
      detailRunId && detailExpId
        ? getRunDetail(detailExpId, detailRunId)
        : Promise.resolve(undefined),
    [detailRunId]
  );

  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));

  const columns: Column<ExperimentRun>[] = [
    {
      key: "select",
      header: "",
      render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={!!checked[r.run_id]} onCheckedChange={() => toggle(r.run_id)} />
        </span>
      ),
    },
    { key: "run_id", header: "Run ID", render: (r) => <span className="font-mono text-xs">{r.run_id}</span> },
    { key: "name", header: "Name", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "framework", header: "Framework" },
    { key: "compute", header: "Compute" },
    { key: "auc", header: "AUC-ROC", sortable: true, accessor: (r) => r.metrics.auc, render: (r) => r.metrics.auc.toFixed(3) },
    { key: "f1", header: "F1", sortable: true, accessor: (r) => r.metrics.f1, render: (r) => r.metrics.f1.toFixed(3) },
    { key: "accuracy", header: "Accuracy", sortable: true, accessor: (r) => r.metrics.accuracy, render: (r) => r.metrics.accuracy.toFixed(3) },
    { key: "training_time_min", header: "Time", sortable: true, render: (r) => `${r.training_time_min}m` },
    { key: "cost", header: "Cost", sortable: true, render: (r) => `$${r.cost.toFixed(2)}` },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    { key: "date", header: "Date", sortable: true, accessor: (r) => r.date, render: (r) => timeAgo(r.date) },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setDetailRunId(r.run_id)}>Details</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const { registry_model_id } = await promoteRun(r.run_id);
              toast.success(`Promoted to registry — ${registry_model_id}`);
            }}
          >
            Promote
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success(`Cloned config from ${r.run_id}`)}>Clone</Button>
        </div>
      ),
    },
  ];

  // Best run (by AUC) among selected, for compare highlighting.
  const bestSelected = useMemo(() => {
    if (selectedRuns.length === 0) return undefined;
    return selectedRuns.reduce((a, b) => (b.metrics.auc > a.metrics.auc ? b : a));
  }, [selectedRuns]);

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Select value={expId} onValueChange={(v) => { setExpId(v); setChecked({}); }}>
        <SelectTrigger className="w-56"><SelectValue placeholder="Experiment" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All experiments</SelectItem>
          {exps.map((e) => (
            <SelectItem key={e.id} value={e.id}>{e.name} ({e.run_count})</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="Complete">Complete</SelectItem>
          <SelectItem value="Running">Running</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Experiments"
        description="Compare runs across experiments, inspect training curves, and promote winners to the registry."
      />

      <DataTable
        columns={columns}
        rows={runs}
        rowKey={(r) => r.run_id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(r) => setDetailRunId(r.run_id)}
        defaultSort={{ key: "auc", dir: "desc" }}
      />

      {/* Compare panel */}
      {selectedRuns.length >= 2 && (
        <SectionCard title={`Compare ${selectedRuns.length} runs`} className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-1 pr-4">Metric</th>
                  {selectedRuns.map((r) => (
                    <th key={r.run_id} className="py-1 pr-4">
                      {r.name}
                      {bestSelected?.run_id === r.run_id && (
                        <span className="ml-1 text-[10px] text-primary">★ best</span>
                      )}
                    </th>
                  ))}
                  <th className="py-1">Δ (vs best)</th>
                </tr>
              </thead>
              <tbody>
                {(["auc", "f1", "accuracy"] as const).map((m) => {
                  const best = bestSelected?.metrics[m] ?? 0;
                  return (
                    <tr key={m} className="border-t border-border">
                      <td className="py-1 pr-4 font-medium uppercase">{m}</td>
                      {selectedRuns.map((r) => (
                        <td key={r.run_id} className="py-1 pr-4 font-mono">{r.metrics[m].toFixed(3)}</td>
                      ))}
                      <td className="py-1 font-mono text-muted-foreground">
                        {(Math.min(...selectedRuns.map((r) => r.metrics[m])) - best).toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t border-border">
                  <td className="py-1 pr-4 font-medium">Cost</td>
                  {selectedRuns.map((r) => (
                    <td key={r.run_id} className="py-1 pr-4 font-mono">${r.cost.toFixed(2)}</td>
                  ))}
                  <td className="py-1" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* Hyperparameter diff (only differing keys) — framework/compute differ per run */}
          <div className="mt-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Config diff: </span>
            {selectedRuns.map((r) => `${r.name}: ${r.framework}/${r.compute}`).join("  ·  ")}
          </div>
        </SectionCard>
      )}

      {/* Run detail drawer */}
      <SideDrawer
        open={!!detailRunId}
        onOpenChange={(o) => !o && setDetailRunId(null)}
        title={detail?.name ?? ""}
        description={detail ? `${detail.framework} · ${detail.compute}` : undefined}
        wide
      >
        {detail && (
          <>
            <SectionCard title="Metrics">
              <InfoList
                items={[
                  { label: "AUC-ROC", value: detail.metrics.auc.toFixed(3) },
                  { label: "F1", value: detail.metrics.f1.toFixed(3) },
                  { label: "Accuracy", value: detail.metrics.accuracy.toFixed(3) },
                  { label: "Training time", value: `${detail.training_time_min}m` },
                  { label: "Cost", value: `$${detail.cost.toFixed(2)}` },
                  { label: "Dataset", value: <span className="font-mono text-xs">{detail.dataset}</span> },
                ]}
              />
            </SectionCard>
            <div className="mt-4">
              <LineChartCard
                title="Loss over epochs"
                data={detail.loss_curve}
                series={[{ key: "train", label: "Train" }, { key: "val", label: "Validation" }]}
                height={200}
              />
            </div>
            <div className="mt-4">
              <LineChartCard
                title="AUC-ROC over epochs"
                data={detail.metric_curve}
                series={[{ key: "auc", label: "AUC-ROC" }]}
                height={200}
              />
            </div>
            <SectionCard title="Hyperparameters" className="mt-4">
              <InfoList
                items={Object.entries(detail.hyperparameters).map(([k, v]) => ({ label: k, value: String(v) }))}
              />
            </SectionCard>
            <SectionCard title="Artifacts" className="mt-4">
              <div className="space-y-1">
                {detail.artifacts.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Logs" className="mt-4">
              <pre className="font-mono text-xs whitespace-pre-wrap text-muted-foreground">{detail.logs}</pre>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Experiments;
