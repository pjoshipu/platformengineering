import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, ShieldOff, UserX, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  getViolations,
  getCompliance,
  getSecurityMetrics,
  type Violation,
} from "./api";

const SecurityDashboard = () => {
  const { data: metrics } = useMockQuery(getSecurityMetrics, []);
  const { data: violations, loading } = useMockQuery(getViolations, []);
  const { data: compliance } = useMockQuery(getCompliance, []);

  const [typeFilter, setTypeFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const [range, setRange] = useState("24h");

  const rows = (violations ?? []).filter(
    (v) =>
      (typeFilter === "all" || v.type === typeFilter) &&
      (sevFilter === "all" || v.severity === sevFilter)
  );

  const columns: Column<Violation>[] = [
    { key: "time", header: "Time", sortable: true, accessor: (v) => v.time, render: (v) => timeAgo(v.time) },
    { key: "severity", header: "Severity", render: (v) => <StatusBadge>{v.severity}</StatusBadge> },
    { key: "type", header: "Type", render: (v) => <StatusBadge tone="neutral">{v.type}</StatusBadge> },
    { key: "resource", header: "Resource", render: (v) => <span className="font-mono text-xs">{v.resource}</span> },
    { key: "user", header: "User", render: (v) => <span className="font-mono text-xs">{v.user}</span> },
    { key: "action", header: "Action taken", render: (v) => <span className="text-sm">{v.action}</span> },
    {
      key: "details",
      header: "",
      align: "right",
      render: (v) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toast(`Details: ${v.resource}`); }}>
          Details
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="Policy">Policy</SelectItem>
          <SelectItem value="Guardrail">Guardrail</SelectItem>
          <SelectItem value="Access">Access</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sevFilter} onValueChange={setSevFilter}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severities</SelectItem>
          <SelectItem value="Critical">Critical</SelectItem>
          <SelectItem value="High">High</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Low">Low</SelectItem>
        </SelectContent>
      </Select>
      <Select value={range} onValueChange={setRange}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Range" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="24h">Last 24h</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Security Posture"
        description="Platform-wide security posture, policy violations, guardrail incidents, and access anomalies."
      />

      <MetricsRow>
        <MetricCard
          label="Policy violations today"
          value={metrics?.violations_today ?? "—"}
          icon={ShieldAlert}
          tone={metrics && metrics.violations_today > 0 ? "poor" : "good"}
        />
        <MetricCard
          label="Guardrail incidents"
          value={metrics?.guardrail_incidents ?? "—"}
          icon={ShieldOff}
          tone={metrics && metrics.guardrail_incidents > 0 ? "warning" : "good"}
        />
        <MetricCard
          label="Access anomalies"
          value={metrics?.access_anomalies ?? "—"}
          icon={UserX}
          tone={metrics && metrics.access_anomalies > 0 ? "warning" : "good"}
        />
        <MetricCard label="Active policies" value={metrics?.active_policies ?? "—"} icon={ShieldCheck} tone="highlight" />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">Violations feed</h2>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(v) => v.id}
            loading={loading}
            toolbar={toolbar}
            defaultSort={{ key: "time", dir: "desc" }}
          />
        </div>

        <SidePanel title="Compliance by namespace">
          {(compliance ?? []).map((c) => (
            <div key={c.namespace} className="rounded-lg border border-border p-2 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{c.namespace}</span>
                <span className={`font-semibold tabular-nums ${c.score >= 90 ? "text-green-600" : c.score >= 80 ? "text-yellow-600" : "text-destructive"}`}>
                  {c.score}%
                </span>
              </div>
              <Progress value={c.score} className="h-1.5" />
              <div className="text-xs text-muted-foreground">{c.non_compliant_count} non-compliant resources</div>
            </div>
          ))}
        </SidePanel>
      </div>
    </div>
  );
};

export default SecurityDashboard;
