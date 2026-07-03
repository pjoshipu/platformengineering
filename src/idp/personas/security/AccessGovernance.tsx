import { useState } from "react";
import { toast } from "sonner";
import { Users, Bot, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getAccessMetrics,
  getAccessRequests,
  getRoleBindings,
  decideAccessRequest,
  revokeBinding,
  type AccessRequest,
  type RoleBinding,
} from "./api";

const AccessGovernance = () => {
  const { data: metrics } = useMockQuery(getAccessMetrics, []);
  const { data: requests, loading: reqLoading, refetch: refetchReq } = useMockQuery(getAccessRequests, []);
  const { data: bindings, loading: bindLoading, refetch: refetchBind } = useMockQuery(getRoleBindings, []);

  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selected, setSelected] = useState<{ kind: "request"; row: AccessRequest } | { kind: "binding"; row: RoleBinding } | null>(null);

  const filteredReqs = (requests ?? []).filter((r) => statusFilter === "all" || r.status === statusFilter);
  const filteredBinds = (bindings ?? []).filter((b) => riskFilter === "all" || b.risk === riskFilter);

  const decide = async (r: AccessRequest, decision: "Approved" | "Rejected") => {
    await decideAccessRequest(r.id, decision);
    toast.success(`${decision}: ${r.requester} → ${r.resource}`);
    refetchReq();
  };

  const reqColumns: Column<AccessRequest>[] = [
    { key: "requester", header: "Requester", render: (r) => <span className="font-mono text-xs">{r.requester}</span> },
    { key: "resource", header: "Resource", render: (r) => <span className="font-mono text-xs">{r.resource}</span> },
    { key: "access_level", header: "Access level", render: (r) => <StatusBadge tone="neutral">{r.access_level}</StatusBadge> },
    { key: "justification", header: "Justification", render: (r) => <span className="text-sm line-clamp-1 max-w-[220px]">{r.justification}</span> },
    { key: "requested", header: "Requested", accessor: (r) => r.requested, render: (r) => timeAgo(r.requested) },
    { key: "status", header: "Status", render: (r) => <StatusBadge>{r.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" disabled={r.status !== "Pending"} onClick={() => decide(r, "Approved")}>Approve</Button>
          <Button variant="ghost" size="sm" disabled={r.status !== "Pending"} onClick={() => decide(r, "Rejected")}>Reject</Button>
        </div>
      ),
    },
  ];

  const bindColumns: Column<RoleBinding>[] = [
    { key: "principal", header: "Principal", render: (b) => <span className="font-mono text-xs">{b.principal}</span> },
    { key: "role", header: "Role", render: (b) => <span className="font-mono text-xs">{b.role}</span> },
    { key: "scope", header: "Scope" },
    { key: "last_used", header: "Last used", sortable: true, accessor: (b) => b.last_used, render: (b) => timeAgo(b.last_used) },
    { key: "risk", header: "Risk", render: (b) => <StatusBadge>{b.risk}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (b) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setSelected({ kind: "binding", row: b })}>Review</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await revokeBinding(b.id); toast.success(`Revoked ${b.role} from ${b.principal}`); refetchBind(); }}
          >
            Revoke
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Access Governance"
        description="Manage identities, roles, and access requests across the platform."
      />

      <MetricsRow>
        <MetricCard label="Users" value={metrics?.users ?? "—"} icon={Users} />
        <MetricCard label="Service accounts" value={metrics?.service_accounts ?? "—"} icon={Bot} />
        <MetricCard
          label="Pending access requests"
          value={metrics?.pending_requests ?? "—"}
          icon={Clock}
          tone={metrics && metrics.pending_requests > 0 ? "warning" : "good"}
        />
        <MetricCard
          label="Over-privileged findings"
          value={metrics?.over_privileged ?? "—"}
          icon={ShieldAlert}
          tone={metrics && metrics.over_privileged > 0 ? "poor" : "good"}
        />
      </MetricsRow>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Access requests</h2>
        <DataTable
          columns={reqColumns}
          rows={filteredReqs}
          rowKey={(r) => r.id}
          loading={reqLoading}
          onRowClick={(r) => setSelected({ kind: "request", row: r })}
          toolbar={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-3">Role bindings & anomalies</h2>
        <DataTable
          columns={bindColumns}
          rows={filteredBinds}
          rowKey={(b) => b.id}
          loading={bindLoading}
          onRowClick={(b) => setSelected({ kind: "binding", row: b })}
          defaultSort={{ key: "last_used", dir: "asc" }}
          toolbar={
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      </div>

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.kind === "request" ? "Access request" : "Role binding"}
        description={selected?.kind === "request" ? selected.row.requester : selected?.kind === "binding" ? selected.row.principal : undefined}
      >
        {selected?.kind === "request" && (
          <>
            <SectionCard title="Request detail">
              <InfoList
                items={[
                  { label: "Requester", value: selected.row.requester },
                  { label: "Resource", value: selected.row.resource },
                  { label: "Access level", value: selected.row.access_level },
                  { label: "Requested", value: timeAgo(selected.row.requested) },
                  { label: "Status", value: <StatusBadge>{selected.row.status}</StatusBadge> },
                ]}
              />
              <p className="text-sm mt-3">{selected.row.justification}</p>
            </SectionCard>
            {selected.row.status === "Pending" && (
              <div className="flex gap-2">
                <Button onClick={() => { decide(selected.row as AccessRequest, "Approved"); setSelected(null); }}>Approve</Button>
                <Button variant="outline" onClick={() => { decide(selected.row as AccessRequest, "Rejected"); setSelected(null); }}>Reject</Button>
              </div>
            )}
          </>
        )}
        {selected?.kind === "binding" && (
          <SectionCard title="Binding detail">
            <InfoList
              items={[
                { label: "Principal", value: selected.row.principal },
                { label: "Role", value: selected.row.role },
                { label: "Scope", value: selected.row.scope },
                { label: "Last used", value: timeAgo(selected.row.last_used) },
                { label: "Risk", value: <StatusBadge>{selected.row.risk}</StatusBadge> },
              ]}
            />
            <Button
              className="mt-3"
              variant="outline"
              onClick={async () => { await revokeBinding(selected.row.id); toast.success(`Revoked ${selected.row.role}`); setSelected(null); refetchBind(); }}
            >
              Revoke binding
            </Button>
          </SectionCard>
        )}
      </SideDrawer>
    </div>
  );
};

export default AccessGovernance;
