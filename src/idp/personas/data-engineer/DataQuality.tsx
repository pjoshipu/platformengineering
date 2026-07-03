import { useState } from "react";
import { CheckCircle2, Bell, Database, Percent } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  LineChartCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getQualityChecks, getQualityCheckDetail, type QualityCheck } from "./api";

const DataQuality = () => {
  const { data: checks, loading } = useMockQuery(getQualityChecks, []);
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<QualityCheck | null>(null);

  const { data: detail } = useMockQuery(
    () => (selected ? getQualityCheckDetail(selected.id) : Promise.resolve(undefined)),
    [selected?.id]
  );

  const all = checks ?? [];
  const rows = all.filter(
    (c) => (severity === "all" || c.severity === severity) && (status === "all" || c.status === status)
  );

  const passing = all.filter((c) => c.status === "Passing").length;
  const alerts = all.filter((c) => c.status === "Failing").length;
  const datasets = new Set(all.map((c) => c.dataset)).size;
  const avgPass = all.length ? Math.round((all.reduce((s, c) => s + c.pass_rate, 0) / all.length) * 10) / 10 : 0;

  const columns: Column<QualityCheck>[] = [
    { key: "dataset", header: "Dataset", sortable: true, render: (c) => <span className="font-mono text-xs">{c.dataset}</span> },
    { key: "check_name", header: "Check", render: (c) => <span className="font-medium">{c.check_name}</span> },
    { key: "type", header: "Type", render: (c) => <StatusBadge tone="neutral">{c.type}</StatusBadge> },
    { key: "pass_rate", header: "Pass rate", sortable: true, render: (c) => (
      <span className={c.pass_rate < 90 ? "text-destructive font-medium" : c.pass_rate < 99 ? "text-yellow-600 font-medium" : "font-medium"}>{c.pass_rate}%</span>
    ) },
    { key: "failed_rows", header: "Failed rows", sortable: true, render: (c) => c.failed_rows.toLocaleString() },
    { key: "severity", header: "Severity", render: (c) => <StatusBadge>{c.severity}</StatusBadge> },
    { key: "last_run", header: "Last run", accessor: (c) => c.last_run, render: (c) => timeAgo(c.last_run) },
    { key: "status", header: "Status", render: (c) => <StatusBadge>{c.status}</StatusBadge> },
  ];

  const toolbar = (
    <div className="flex gap-2">
      <Select value={severity} onValueChange={setSeverity}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="Passing">Passing</SelectItem>
          <SelectItem value="Warning">Warning</SelectItem>
          <SelectItem value="Failing">Failing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Data Quality"
        description="Quality checks across all monitored datasets. Click a check to inspect failing rows and its pass-rate trend."
      />

      <MetricsRow>
        <MetricCard label="Checks passing" value={`${passing}/${all.length}`} icon={CheckCircle2} tone="good" />
        <MetricCard label="Active alerts" value={alerts} icon={Bell} tone={alerts > 0 ? "poor" : "good"} />
        <MetricCard label="Datasets monitored" value={datasets} icon={Database} />
        <MetricCard label="Avg pass rate" value={`${avgPass}%`} icon={Percent} tone={avgPass < 95 ? "warning" : "good"} />
      </MetricsRow>

      <div className="mt-8">
        <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} loading={loading} toolbar={toolbar} onRowClick={(c) => setSelected(c)} defaultSort={{ key: "severity", dir: "desc" }} />
      </div>

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.check_name ?? "Quality check"}
        description={selected ? `${selected.dataset} · ${selected.type}` : undefined}
        wide
      >
        {selected && (
          <>
            <SectionCard title="Summary">
              <div className="flex flex-wrap gap-4 text-sm">
                <div><span className="text-muted-foreground">Pass rate: </span><span className="font-medium">{selected.pass_rate}%</span></div>
                <div><span className="text-muted-foreground">Failed rows: </span><span className="font-medium">{selected.failed_rows.toLocaleString()}</span></div>
                <div className="flex items-center gap-1"><span className="text-muted-foreground">Severity: </span><StatusBadge>{selected.severity}</StatusBadge></div>
                <div className="flex items-center gap-1"><span className="text-muted-foreground">Status: </span><StatusBadge>{selected.status}</StatusBadge></div>
              </div>
            </SectionCard>

            {detail && detail.failed_samples.length > 0 && (
              <SectionCard title="Failed-row samples">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="py-1.5 pr-2">Row id</th>
                        <th className="py-1.5 pr-2">Column</th>
                        <th className="py-1.5 pr-2">Value</th>
                        <th className="py-1.5">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.failed_samples.map((r) => (
                        <tr key={r.row_id} className="border-b border-border last:border-0">
                          <td className="py-1.5 pr-2 font-mono text-xs">{r.row_id}</td>
                          <td className="py-1.5 pr-2 font-mono text-xs">{r.column}</td>
                          <td className="py-1.5 pr-2 font-mono text-xs">{r.value}</td>
                          <td className="py-1.5 text-muted-foreground">{r.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {detail && (
              <LineChartCard
                title="Pass rate over time"
                data={detail.pass_rate_history}
                series={[{ key: "pass_rate", label: "Pass rate %" }]}
                xKey="ts"
                threshold={selected.type === "Not null" ? 100 : 95}
                height={200}
              />
            )}
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default DataQuality;
