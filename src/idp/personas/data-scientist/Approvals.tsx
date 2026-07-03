import { useState } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  SideDrawer,
  InfoList,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getApprovals, actionApproval, type ApprovalRequest } from "./api";

const Approvals = () => {
  const { data, loading, refetch } = useMockQuery(getApprovals, []);
  const all = data ?? [];
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);

  const rows = all.filter((a) => statusFilter === "all" || a.status === statusFilter);

  const counts = {
    pending: all.filter((a) => a.status === "Pending").length,
    approved: all.filter((a) => a.status === "Approved").length,
    rejected: all.filter((a) => a.status === "Rejected").length,
  };

  const decide = async (a: ApprovalRequest, decision: "Approved" | "Rejected") => {
    await actionApproval(a.id, decision);
    toast.success(`${a.request} — ${decision}`);
    setSelected(null);
    refetch();
  };

  const columns: Column<ApprovalRequest>[] = [
    { key: "request", header: "Request", sortable: true, render: (a) => <span className="font-medium">{a.request}</span> },
    { key: "model", header: "Model", render: (a) => <span className="font-mono text-xs">{a.model}</span> },
    { key: "target_env", header: "Target env", render: (a) => <StatusBadge tone="neutral">{a.target_env}</StatusBadge> },
    { key: "requested_by", header: "Requested by" },
    { key: "date", header: "Date", sortable: true, accessor: (a) => a.date, render: (a) => timeAgo(a.date) },
    { key: "status", header: "Status", render: (a) => <StatusBadge>{a.status}</StatusBadge> },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          {a.status === "Pending" ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => decide(a, "Approved")}>Approve</Button>
              <Button variant="ghost" size="sm" onClick={() => decide(a, "Rejected")}>Reject</Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setSelected(a)}>View</Button>
          )}
        </div>
      ),
    },
  ];

  const toolbar = (
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        <SelectItem value="Pending">Pending</SelectItem>
        <SelectItem value="Approved">Approved</SelectItem>
        <SelectItem value="Rejected">Rejected</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Promotion and training approval requests you submitted or must action."
      />

      <MetricsRow>
        <MetricCard label="Pending" value={counts.pending} icon={Clock} tone={counts.pending > 0 ? "warning" : "good"} />
        <MetricCard label="Approved" value={counts.approved} icon={CheckCircle2} tone="good" />
        <MetricCard label="Rejected" value={counts.rejected} icon={XCircle} tone={counts.rejected > 0 ? "poor" : "default"} />
        <MetricCard label="Total" value={all.length} />
      </MetricsRow>

      <div className="mt-8">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(a) => a.id}
          loading={loading}
          toolbar={toolbar}
          onRowClick={(a) => setSelected(a)}
          defaultSort={{ key: "date", dir: "desc" }}
        />
      </div>

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected?.request ?? ""}
        description={selected ? `${selected.model} → ${selected.target_env}` : undefined}
      >
        {selected && (
          <>
            <InfoList
              items={[
                { label: "Model", value: <span className="font-mono text-xs">{selected.model}</span> },
                { label: "Target env", value: selected.target_env },
                { label: "Requested by", value: selected.requested_by },
                { label: "Requested", value: timeAgo(selected.date) },
                { label: "Status", value: <StatusBadge>{selected.status}</StatusBadge> },
              ]}
            />
            {selected.status === "Pending" && (
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => decide(selected, "Approved")}>Approve</Button>
                <Button variant="outline" className="flex-1" onClick={() => decide(selected, "Rejected")}>Reject</Button>
              </div>
            )}
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default Approvals;
