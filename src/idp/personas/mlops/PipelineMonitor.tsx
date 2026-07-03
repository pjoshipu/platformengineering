import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  LineChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getPipelines,
  getPipelineRuns,
  triggerRetraining,
  type Pipeline,
} from "./api";

const PipelineMonitor = () => {
  const navigate = useNavigate();
  const { data: pipelines, loading, refetch } = useMockQuery(getPipelines, []);
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Pipeline | null>(null);

  const { data: runs } = useMockQuery(
    () => (selected ? getPipelineRuns(selected.id) : Promise.resolve(undefined)),
    [selected?.id]
  );

  const rows = (pipelines ?? []).filter((p) => status === "all" || p.status === status);

  const columns: Column<Pipeline>[] = [
    { key: "name", header: "Pipeline", sortable: true, render: (p) => <span className="font-medium">{p.name}</span> },
    { key: "last_run", header: "Last run", sortable: true, accessor: (p) => p.last_run, render: (p) => timeAgo(p.last_run) },
    { key: "duration_min", header: "Duration", sortable: true, render: (p) => `${p.duration_min}m` },
    { key: "status", header: "Status", render: (p) => <StatusBadge>{p.status}</StatusBadge> },
    { key: "next_run", header: "Next run", render: (p) => `in ${timeAgo(p.next_run).replace(" ago", "")}` },
    { key: "model_name", header: "Model served", render: (p) => <span className="font-mono text-xs">{p.model_name}</span> },
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
          <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>View runs</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/idp/mlops/drift/${p.model_id}`)}>View drift</Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <Select value={status} onValueChange={setStatus}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="Running">Running</SelectItem>
        <SelectItem value="Success">Success</SelectItem>
        <SelectItem value="Failed">Failed</SelectItem>
        <SelectItem value="Skipped">Skipped</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader
        title="Pipeline Monitor"
        description="All ML training and feature pipelines, their latest runs, and schedules."
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(p) => setSelected(p)}
      />

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.name} — run history` : ""}
        description={selected ? `serves ${selected.model_name}` : undefined}
        wide
      >
        {runs && (
          <>
            <SectionCard title="Run duration">
              <LineChartCard
                title=""
                data={runs.chart}
                series={[{ key: "duration", label: "Duration (min)" }]}
                height={200}
              />
            </SectionCard>
            <SectionCard title="Recent runs">
              <div className="space-y-2">
                {runs.runs.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                    <div>
                      <div className="font-mono text-xs">{r.id}</div>
                      <div className="text-xs text-muted-foreground">{timeAgo(r.ts)} · {r.duration_min}m</div>
                    </div>
                    <StatusBadge>{r.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default PipelineMonitor;
