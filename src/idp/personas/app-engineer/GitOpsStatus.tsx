import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  SideDrawer,
  DiffViewer,
  SectionCard,
  type Column,
} from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import {
  getGitOpsApps,
  getGitOpsDiff,
  getGitOpsHistory,
  syncApp,
  type GitOpsApp,
} from "./api";

const GitOpsStatus = () => {
  const { data: apps, loading, refetch } = useMockQuery(getGitOpsApps, []);
  const [selected, setSelected] = useState<GitOpsApp | null>(null);

  const { data: diff } = useMockQuery(
    () => (selected ? getGitOpsDiff(selected.name) : Promise.resolve(undefined)),
    [selected?.name]
  );
  const { data: history } = useMockQuery(
    () => (selected ? getGitOpsHistory(selected.name) : Promise.resolve([])),
    [selected?.name]
  );

  const columns: Column<GitOpsApp>[] = [
    { key: "name", header: "App", sortable: true, render: (a) => <span className="font-medium">{a.name}</span> },
    { key: "namespace", header: "Namespace" },
    { key: "sync_status", header: "Sync", render: (a) => <StatusBadge>{a.sync_status}</StatusBadge> },
    { key: "health", header: "Health", render: (a) => <StatusBadge>{a.health}</StatusBadge> },
    { key: "last_sync", header: "Last sync", sortable: true, accessor: (a) => a.last_sync, render: (a) => timeAgo(a.last_sync) },
    { key: "commit_sha", header: "Commit", render: (a) => <span className="font-mono text-xs">{a.commit_sha}</span> },
    {
      key: "actions",
      header: "Actions",
      render: (a) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await syncApp(a.name);
              toast.success(`Sync triggered: ${a.name}`);
              refetch();
            }}
          >
            Sync now
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(a)}>
            View diff
          </Button>
        </div>
      ),
    },
  ];

  const outOfSync = (apps ?? []).filter((a) => a.sync_status === "Out of sync");

  return (
    <div>
      <PageHeader
        title="GitOps Status"
        description="Monitor sync status across all tracked apps, inspect drift, and trigger syncs."
        actions={
          <Button
            onClick={async () => {
              await Promise.all(outOfSync.map((a) => syncApp(a.name)));
              toast.success(`Syncing ${outOfSync.length} out-of-sync app(s)`);
              refetch();
            }}
            disabled={outOfSync.length === 0}
          >
            Sync all ({outOfSync.length})
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={apps ?? []}
        rowKey={(a) => a.name}
        loading={loading}
        onRowClick={(a) => setSelected(a)}
        defaultSort={{ key: "sync_status", dir: "desc" }}
      />

      <SideDrawer
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        title={selected ? `${selected.name} — drift detail` : ""}
        description={selected ? `${selected.namespace} · commit ${selected.commit_sha}` : undefined}
        wide
      >
        {diff && (
          <SectionCard title="Desired (git) vs live (cluster)">
            <DiffViewer
              before={diff.live_yaml}
              after={diff.desired_yaml}
              beforeLabel="live cluster state"
              afterLabel="desired git state"
            />
            <Button
              className="mt-3"
              onClick={async () => {
                if (selected) {
                  await syncApp(selected.name);
                  toast.success(`Applying desired state to ${selected.name}`);
                  setSelected(null);
                  refetch();
                }
              }}
            >
              Sync to desired state
            </Button>
          </SectionCard>
        )}

        <SectionCard title="Sync history">
          <div className="space-y-2">
            {(history ?? []).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <div className="font-mono text-xs">{h.commit}</div>
                  <div className="text-xs text-muted-foreground">
                    {h.user} · {timeAgo(h.sync_time)} · {h.duration}
                  </div>
                </div>
                <StatusBadge>{h.result}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </SideDrawer>
    </div>
  );
};

export default GitOpsStatus;
