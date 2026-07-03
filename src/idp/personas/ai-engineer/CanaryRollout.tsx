import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SectionCard,
  Field,
  type Column,
} from "@/idp/components";
import { Loading } from "@/idp/components/states";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getCanaries,
  getCanary,
  getCanaryLogs,
  updateCanarySplit,
  promoteCanary,
  rollbackCanary,
  type Canary,
  type CanaryGate,
} from "./api";

// --- Landing: active canaries ----------------------------------------------

const CanaryLanding = () => {
  const navigate = useNavigate();
  const { data: canaries, loading } = useMockQuery(getCanaries, []);
  const columns: Column<Canary>[] = [
    { key: "app_name", header: "App", render: (c) => <span className="font-medium">{c.app_name}</span> },
    { key: "prod_version", header: "Prod", render: (c) => <span className="font-mono text-xs">{c.prod_version}</span> },
    { key: "canary_version", header: "Canary", render: (c) => <span className="font-mono text-xs">{c.canary_version}</span> },
    { key: "split_pct", header: "Canary %", align: "right", render: (c) => `${c.split_pct}%` },
    {
      key: "gates",
      header: "Gates",
      render: (c) => {
        const pass = c.gates.filter((g) => g.status === "Pass").length;
        return <StatusBadge tone={pass === c.gates.length ? "success" : "warning"}>{`${pass}/${c.gates.length} pass`}</StatusBadge>;
      },
    },
  ];
  return (
    <div>
      <PageHeader title="Canary Rollout" description="Active canary deployments. Select one to inspect traffic split, gates, and logs." />
      <DataTable columns={columns} rows={canaries ?? []} rowKey={(c) => c.id} loading={loading} onRowClick={(c) => navigate(`/idp/ai-engineer/canary/${c.id}`)} />
    </div>
  );
};

// --- Detail: canary/:canaryId ----------------------------------------------

const GateIcon = ({ status }: { status: CanaryGate["status"] }) =>
  status === "Pass" ? (
    <CheckCircle2 className="w-4 h-4 text-green-600" />
  ) : status === "Fail" ? (
    <XCircle className="w-4 h-4 text-destructive" />
  ) : (
    <AlertCircle className="w-4 h-4 text-yellow-600" />
  );

const METRIC_ROWS: { key: string; label: string }[] = [
  { key: "faithfulness", label: "Faithfulness" },
  { key: "hallucination", label: "Hallucination rate" },
  { key: "p95", label: "p95 latency" },
  { key: "cost", label: "Cost/call" },
  { key: "error_rate", label: "Error rate" },
  { key: "satisfaction", label: "User satisfaction" },
];

const CanaryDetail = ({ canaryId }: { canaryId: string }) => {
  const navigate = useNavigate();
  const { data: canary, loading } = useMockQuery(() => getCanary(canaryId), [canaryId]);
  const { data: logs } = useMockQuery(() => getCanaryLogs(canaryId), [canaryId]);

  const [split, setSplit] = useState(20);
  const [logFilter, setLogFilter] = useState("all");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    if (canary) setSplit(canary.split_pct);
  }, [canary]);

  if (loading || !canary) return <Loading label="Loading canary…" />;

  const gates = canary.gates;
  const needsReview = gates.some((g) => g.status === "Needs review");
  const anyFail = gates.some((g) => g.status === "Fail");
  const allPass = gates.every((g) => g.status === "Pass");
  // Promote is enabled when all gates pass, OR a reviewer overrides the review-status gates.
  const canPromote = allPass || (!anyFail && needsReview && overrideReason.trim().length > 0);

  const filteredLogs = (logs ?? []).filter((l) =>
    logFilter === "all" ? true : logFilter === "errors" ? l.level === "error" : l.level === "quality"
  );

  const gateStatus = (label: string): CanaryGate["status"] => {
    // rough per-metric delta gate mapping for the comparison table
    const g = gates.find((x) => x.name.toLowerCase().includes(label.toLowerCase().split(" ")[0]));
    return g?.status ?? "Pass";
  };

  const metricColumns: Column<{ key: string; label: string }>[] = [
    { key: "label", header: "Metric", render: (r) => <span className="font-medium">{r.label}</span> },
    { key: "prod", header: "Prod", align: "right", render: (r) => canary.metrics.prod[r.key] ?? "—" },
    { key: "canary", header: "Canary", align: "right", render: (r) => canary.metrics.canary[r.key] ?? "—" },
    {
      key: "delta",
      header: "Delta",
      align: "right",
      render: (r) => {
        const p = parseFloat(String(canary.metrics.prod[r.key] ?? "").replace(/[^0-9.-]/g, ""));
        const c = parseFloat(String(canary.metrics.canary[r.key] ?? "").replace(/[^0-9.-]/g, ""));
        if (isNaN(p) || isNaN(c)) return "—";
        const d = c - p;
        return <span className={d === 0 ? "" : d < 0 ? "text-green-600" : "text-yellow-600"}>{d > 0 ? "+" : ""}{d.toFixed(2)}</span>;
      },
    },
    {
      key: "gate",
      header: "Gate",
      render: (r) => {
        const s = gateStatus(r.label);
        return <StatusBadge tone={s === "Pass" ? "success" : s === "Fail" ? "danger" : "warning"}>{s}</StatusBadge>;
      },
    },
  ];

  const applySplit = async () => {
    await updateCanarySplit(canaryId, split);
    toast.success(`Traffic split updated to ${split}%`);
  };

  const promote = async () => {
    if (!canPromote) {
      toast.error("Gates not passing — provide an override reason for review-status gates");
      return;
    }
    await promoteCanary(canaryId, overrideReason || undefined);
    toast.success(`Promoting ${canary.canary_version} to 100%`);
    navigate("/idp/ai-engineer/dashboard");
  };

  const doRollback = async () => {
    await rollbackCanary(canaryId);
    toast.success(`Rolled back ${canary.app_name} canary`);
    navigate("/idp/ai-engineer/dashboard");
  };

  return (
    <div>
      <PageHeader
        title={`Canary — ${canary.app_name}`}
        description={`${100 - split}% ${canary.prod_version} / ${split}% ${canary.canary_version}`}
        backTo="/idp/ai-engineer/canary"
        backLabel="Active canaries"
      />

      {/* Traffic split control */}
      <SectionCard title="Traffic split">
        <div className="flex h-8 w-full overflow-hidden rounded-lg border border-border text-xs font-medium">
          <div className="flex items-center justify-center bg-muted text-muted-foreground" style={{ width: `${100 - split}%` }}>
            prod {100 - split}%
          </div>
          <div className="flex items-center justify-center bg-primary/20 text-primary" style={{ width: `${split}%` }}>
            canary {split}%
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <Slider value={[split]} min={5} max={50} step={5} onValueChange={([v]) => setSplit(v)} />
          </div>
          <span className="font-mono text-sm w-12 text-right">{split}%</span>
          <Button onClick={applySplit}>Update split</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {100 - split}% {canary.prod_version} / {split}% {canary.canary_version}
        </p>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        <SectionCard title="Metrics comparison">
          <DataTable columns={metricColumns} rows={METRIC_ROWS} rowKey={(r) => r.key} />
        </SectionCard>

        <SectionCard title="Promotion gates">
          <div className="space-y-2">
            {gates.map((g) => (
              <div key={g.name} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
                <div className="flex items-center gap-2 min-w-0">
                  <GateIcon status={g.status} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{g.name}</div>
                    <div className="text-xs text-muted-foreground">threshold {g.threshold} · current {g.current}</div>
                  </div>
                </div>
                <StatusBadge tone={g.status === "Pass" ? "success" : g.status === "Fail" ? "danger" : "warning"}>{g.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Override for review-status gates */}
      {needsReview && !anyFail && (
        <SectionCard title="Reviewer override" className="mt-6">
          <p className="text-xs text-muted-foreground mb-2">
            One or more gates need review. Provide a reason to enable promotion.
          </p>
          <Field label="Override reason" required>
            <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} className="h-20" placeholder="Why is it safe to promote despite the review-status gate?" />
          </Field>
        </SectionCard>
      )}

      {/* Live log panel */}
      <SectionCard
        title="Live log"
        className="mt-6"
        actions={
          <Select value={logFilter} onValueChange={setLogFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="errors">Errors only</SelectItem>
              <SelectItem value="quality">Quality events</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
          {filteredLogs.length === 0 && <div className="text-muted-foreground">No matching log lines.</div>}
          {filteredLogs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground shrink-0">{timeAgo(l.time)}</span>
              <span className={l.level === "error" ? "text-destructive" : l.level === "quality" ? "text-yellow-600" : "text-foreground"}>
                [{l.level}]
              </span>
              <span>{l.message}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="mt-6 flex gap-2">
        <Button onClick={promote} disabled={!canPromote}>Promote to 100%</Button>
        <Button variant="destructive" onClick={doRollback}>Roll back</Button>
      </div>
    </div>
  );
};

const CanaryRollout = () => {
  const { canaryId } = useParams<{ canaryId: string }>();
  if (!canaryId) return <CanaryLanding />;
  return <CanaryDetail canaryId={canaryId} />;
};

export default CanaryRollout;
