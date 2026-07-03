import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  InfoList,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getAuditEvents, type AuditEvent } from "./api";

const ACTIONS = ["Retrain", "Promote", "Rule change", "Pipeline edit"];

const AuditLog = () => {
  const { data: events, loading } = useMockQuery(getAuditEvents, []);
  const [action, setAction] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const rows = (events ?? []).filter(
    (e) =>
      (action === "all" || e.action === action) &&
      (outcome === "all" || e.outcome === outcome) &&
      (!dateFrom || new Date(e.ts) >= new Date(dateFrom))
  );

  const columns: Column<AuditEvent>[] = [
    { key: "ts", header: "Timestamp", sortable: true, accessor: (e) => e.ts, render: (e) => timeAgo(e.ts) },
    { key: "user", header: "User", render: (e) => <span className="font-mono text-xs">{e.user}</span> },
    { key: "action", header: "Action", render: (e) => <StatusBadge tone="neutral">{e.action}</StatusBadge> },
    { key: "resource", header: "Resource", render: (e) => <span className="font-medium">{e.resource}</span> },
    { key: "outcome", header: "Outcome", render: (e) => <StatusBadge>{e.outcome}</StatusBadge> },
    { key: "details", header: "Details", className: "max-w-xs truncate text-muted-foreground text-sm" },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {ACTIONS.map((a) => (
            <SelectItem key={a} value={a}>{a}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={outcome} onValueChange={setOutcome}>
        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outcomes</SelectItem>
          <SelectItem value="Success">Success</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="ML platform actions — retraining, promotions, rule changes, and pipeline edits."
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(e) => e.id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(e) => setSelected(e)}
        defaultSort={{ key: "ts", dir: "desc" }}
      />

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.action} — ${selected.resource}` : ""}
        description={selected ? `${selected.user} · ${timeAgo(selected.ts)}` : undefined}
        wide
      >
        {selected && (
          <>
            <SectionCard title="Event">
              <InfoList
                items={[
                  { label: "User", value: selected.user },
                  { label: "Action", value: selected.action },
                  { label: "Resource", value: selected.resource },
                  { label: "Outcome", value: <StatusBadge>{selected.outcome}</StatusBadge> },
                  { label: "Details", value: selected.details },
                ]}
              />
            </SectionCard>
            <SectionCard title="Event payload">
              <pre className="font-mono text-xs bg-muted/40 rounded-lg p-3 overflow-x-auto">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default AuditLog;
