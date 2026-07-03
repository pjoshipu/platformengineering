import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  SectionCard,
  DiffViewer,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getAuditEvents,
  getAuditEvent,
  exportAudit,
  type AuditEvent,
  type AuditQuery,
} from "./api";

const AuditLog = () => {
  const [filters, setFilters] = useState<AuditQuery>({ page: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading } = useMockQuery(() => getAuditEvents(filters), [
    filters.user,
    filters.action,
    filters.resource_type,
    filters.outcome,
    filters.start,
    filters.end,
    filters.page,
  ]);

  const { data: detail } = useMockQuery(
    () => (selectedId ? getAuditEvent(selectedId) : Promise.resolve(undefined)),
    [selectedId]
  );

  const setFilter = (patch: Partial<AuditQuery>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const pageSize = data?.page_size ?? 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns: Column<AuditEvent>[] = [
    { key: "ts", header: "Timestamp", render: (e) => timeAgo(e.ts) },
    { key: "user", header: "User", render: (e) => <span className="font-mono text-xs">{e.user}</span> },
    { key: "action", header: "Action" },
    { key: "resource_type", header: "Resource type", render: (e) => <StatusBadge tone="neutral">{e.resource_type}</StatusBadge> },
    { key: "resource_name", header: "Resource", render: (e) => <span className="font-mono text-xs">{e.resource_name}</span> },
    { key: "outcome", header: "Outcome", render: (e) => <StatusBadge>{e.outcome}</StatusBadge> },
    { key: "ip", header: "IP address", render: (e) => <span className="font-mono text-xs">{e.ip}</span> },
    {
      key: "details",
      header: "",
      align: "right",
      render: (e) => (
        <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setSelectedId(e.id); }}>Details</Button>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="From (YYYY-MM-DD)"
        className="w-[150px]"
        value={filters.start ?? ""}
        onChange={(e) => setFilter({ start: e.target.value })}
      />
      <Input
        placeholder="To (YYYY-MM-DD)"
        className="w-[150px]"
        value={filters.end ?? ""}
        onChange={(e) => setFilter({ end: e.target.value })}
      />
      <Input
        placeholder="Search user…"
        className="w-[150px]"
        value={filters.user ?? ""}
        onChange={(e) => setFilter({ user: e.target.value })}
      />
      <Select value={filters.action ?? "all"} onValueChange={(v) => setFilter({ action: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Action" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          <SelectItem value="Deploy">Deploy</SelectItem>
          <SelectItem value="Approve">Approve</SelectItem>
          <SelectItem value="Rollback">Rollback</SelectItem>
          <SelectItem value="Policy change">Policy change</SelectItem>
          <SelectItem value="Access request">Access request</SelectItem>
          <SelectItem value="Config change">Config change</SelectItem>
          <SelectItem value="Delete">Delete</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.resource_type ?? "all"} onValueChange={(v) => setFilter({ resource_type: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Resource type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All resources</SelectItem>
          <SelectItem value="Service">Service</SelectItem>
          <SelectItem value="Model">Model</SelectItem>
          <SelectItem value="Pipeline">Pipeline</SelectItem>
          <SelectItem value="Policy">Policy</SelectItem>
          <SelectItem value="Dataset">Dataset</SelectItem>
          <SelectItem value="Infra">Infra</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.outcome ?? "all"} onValueChange={(v) => setFilter({ outcome: v })}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Outcome" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All outcomes</SelectItem>
          <SelectItem value="Success">Success</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
          <SelectItem value="Blocked">Blocked</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Immutable record of all platform actions. Filter, inspect, and export for SIEM."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => { await exportAudit("csv", filters); toast.success("Exported CSV (respecting filters)"); }}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button variant="outline" onClick={async () => { await exportAudit("siem", filters); toast.success("Streamed to SIEM (respecting filters)"); }}>
              <Download className="w-4 h-4 mr-1" /> Export for SIEM
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.events ?? []}
        rowKey={(e) => e.id}
        loading={loading}
        toolbar={toolbar}
        onRowClick={(e) => setSelectedId(e.id)}
      />

      <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
        <span>{total} events · page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Event detail drawer */}
      <SideDrawer
        open={!!selectedId}
        onOpenChange={(o) => !o && setSelectedId(null)}
        title="Audit event"
        description={selectedId ?? undefined}
        wide
      >
        {detail && (
          <>
            <SectionCard title="Event payload">
              <pre className="font-mono text-xs whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 overflow-x-auto">
                {JSON.stringify(detail.payload, null, 2)}
              </pre>
            </SectionCard>

            <SectionCard title="Before / after state">
              <DiffViewer
                before={detail.before_state}
                after={detail.after_state}
                beforeLabel="before"
                afterLabel="after"
              />
            </SectionCard>

            <SectionCard title="Related events">
              <div className="space-y-2">
                {detail.related_events.length === 0 && (
                  <p className="text-sm text-muted-foreground">No related events.</p>
                )}
                {detail.related_events.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className="w-full flex items-center justify-between rounded-lg border border-border p-2 text-left hover:bg-muted"
                  >
                    <div>
                      <div className="text-sm font-medium">{e.action} · {e.resource_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{e.id} · {timeAgo(e.ts)}</div>
                    </div>
                    <StatusBadge>{e.outcome}</StatusBadge>
                  </button>
                ))}
              </div>
            </SectionCard>
          </>
        )}
      </SideDrawer>
    </div>
  );
};

export default AuditLog;
