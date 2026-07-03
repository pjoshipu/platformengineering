import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ListChecks, AlertCircle, CalendarClock, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  Field,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getReportMetrics,
  getReports,
  getReportControls,
  generateReport,
  type ComplianceReport,
} from "./api";

const ComplianceReports = () => {
  const { data: metrics } = useMockQuery(getReportMetrics, []);
  const { data: reports, loading, refetch } = useMockQuery(getReports, []);

  const [selected, setSelected] = useState<ComplianceReport | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [form, setForm] = useState({ framework: "SOC 2", period: "H2 2026", scope: "all namespaces" });
  const [submitting, setSubmitting] = useState(false);

  const { data: controls } = useMockQuery(
    () => (selected ? getReportControls(selected.framework) : Promise.resolve([])),
    [selected?.framework, selected?.id]
  );

  const columns: Column<ComplianceReport>[] = [
    { key: "name", header: "Report", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "framework", header: "Framework", render: (r) => <StatusBadge tone="neutral">{r.framework}</StatusBadge> },
    { key: "period", header: "Period" },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    {
      key: "score",
      header: "Compliance",
      sortable: true,
      align: "right",
      accessor: (r) => r.score,
      render: (r) => <span className={`tabular-nums font-medium ${r.score >= 90 ? "text-green-600" : r.score >= 80 ? "text-yellow-600" : "text-destructive"}`}>{r.score}%</span>,
    },
    { key: "generated", header: "Generated", sortable: true, accessor: (r) => r.generated, render: (r) => timeAgo(r.generated) },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>View</Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success(`Downloading ${r.name}.pdf`)}>Download</Button>
          <Button variant="ghost" size="sm" onClick={async () => { await generateReport({ id: r.id }); toast.success(`Regenerating ${r.name}`); refetch(); }}>Regenerate</Button>
        </div>
      ),
    },
  ];

  const submit = async () => {
    setSubmitting(true);
    await generateReport(form);
    setSubmitting(false);
    toast.success(`Generating ${form.framework} report for ${form.period}`);
    setGenOpen(false);
    refetch();
  };

  const ControlIcon = ({ status }: { status: "Pass" | "Fail" | "N/A" }) =>
    status === "Pass" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
    status === "Fail" ? <XCircle className="w-4 h-4 text-destructive" /> :
    <MinusCircle className="w-4 h-4 text-muted-foreground" />;

  return (
    <div>
      <PageHeader
        title="Compliance Reports"
        description="Generate and browse compliance reports across SOC 2, GDPR, ISO 27001, and internal frameworks."
        actions={<Button onClick={() => setGenOpen(true)}>Generate report</Button>}
      />

      <MetricsRow>
        <MetricCard
          label="Overall compliance"
          value={metrics ? `${metrics.overall_compliance}%` : "—"}
          icon={ShieldCheck}
          tone={metrics && metrics.overall_compliance >= 90 ? "good" : "warning"}
        />
        <MetricCard label="Controls passing" value={metrics?.controls_passing ?? "—"} icon={ListChecks} />
        <MetricCard
          label="Open findings"
          value={metrics?.open_findings ?? "—"}
          icon={AlertCircle}
          tone={metrics && metrics.open_findings > 0 ? "poor" : "good"}
        />
        <MetricCard label="Next audit" value={metrics?.next_audit ?? "—"} icon={CalendarClock} tone="highlight" />
      </MetricsRow>

      <div className="mt-8">
        <DataTable
          columns={columns}
          rows={reports ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          onRowClick={(r) => setSelected(r)}
          defaultSort={{ key: "generated", dir: "desc" }}
        />
      </div>

      {/* Control checklist drawer */}
      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.name ?? ""}
        description={selected ? `${selected.framework} · ${selected.period}` : undefined}
        wide
      >
        {selected && (
          <>
            <div className="flex gap-2">
              <StatusBadge>{selected.status}</StatusBadge>
              <StatusBadge tone={selected.score >= 90 ? "success" : selected.score >= 80 ? "warning" : "danger"}>{selected.score}% compliant</StatusBadge>
            </div>
            <SectionCard title="Control checklist">
              <div className="space-y-2">
                {(controls ?? []).map((c) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-2">
                    <ControlIcon status={c.status} />
                    <div>
                      <div className="text-sm font-medium">
                        <span className="font-mono text-xs text-muted-foreground mr-2">{c.id}</span>
                        {c.control}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <div className="flex gap-2">
              <Button onClick={() => toast.success(`Downloading ${selected.name}.pdf`)}>Download PDF</Button>
              <Button variant="outline" onClick={async () => { await generateReport({ id: selected.id }); toast.success("Regenerating"); refetch(); }}>Regenerate</Button>
            </div>
          </>
        )}
      </SideDrawer>

      {/* Generate report dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate compliance report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Framework" required>
              <Select value={form.framework} onValueChange={(v) => setForm({ ...form, framework: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Period" required>
              <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="H2 2026" />
            </Field>
            <Field label="Scope">
              <Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="all namespaces" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Generating…" : "Generate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplianceReports;
