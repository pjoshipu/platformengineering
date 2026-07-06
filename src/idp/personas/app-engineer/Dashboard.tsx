import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Server, AlertTriangle, Rocket, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  getServices,
  getMetrics,
  getGitOpsApps,
  syncApp,
  type Service,
} from "./api";

const AppEngineerDashboard = () => {
  const navigate = useNavigate();
  const { data: metrics } = useMockQuery(getMetrics, []);
  const { data: services, loading } = useMockQuery(getServices, []);
  const { data: gitops, refetch } = useMockQuery(getGitOpsApps, []);

  const columns: Column<Service>[] = [
    { key: "name", header: "Service", sortable: true, render: (s) => <span className="font-medium">{s.name}</span> },
    { key: "env", header: "Env", render: (s) => <StatusBadge tone="neutral">{s.env}</StatusBadge> },
    { key: "version", header: "Version", render: (s) => <span className="font-mono text-xs">{s.version}</span> },
    { key: "sync_status", header: "Sync", render: (s) => <StatusBadge>{s.sync_status}</StatusBadge> },
    { key: "health", header: "Health", render: (s) => <StatusBadge>{s.health}</StatusBadge> },
    { key: "last_deployed", header: "Last deployed", sortable: true, accessor: (s) => s.last_deployed, render: (s) => timeAgo(s.last_deployed) },
    {
      key: "actions",
      header: "Actions",
      render: (s) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => toast.success(`Redeploying ${s.name}`)}>Redeploy</Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Logs for ${s.name}`)}>Logs</Button>
          <Button variant="ghost" size="sm" onClick={() => toast(`Scale ${s.name}`)}>Scale</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="App Engineer Dashboard"
        description="Status of your deployed services, GitOps sync health, and active deployments."
        actions={<Button onClick={() => navigate("/app-engineer/deploy")}>New Service Request</Button>}
      />

      <MetricsRow>
        <MetricCard label="Services deployed" value={metrics?.services ?? "—"} icon={Server} />
        <MetricCard
          label="Sync errors"
          value={metrics?.sync_errors ?? "—"}
          icon={AlertTriangle}
          tone={metrics && metrics.sync_errors > 0 ? "poor" : "good"}
        />
        <MetricCard label="Active deployments" value={metrics?.active_deployments ?? "—"} icon={Rocket} tone="highlight" />
        <MetricCard
          label="Infrastructure drift"
          value={metrics?.infra_drift ?? "—"}
          icon={GitCompare}
          tone={metrics && metrics.infra_drift > 0 ? "warning" : "good"}
        />
      </MetricsRow>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] mt-8">
        <div>
          <h2 className="font-semibold mb-3">Services</h2>
          <DataTable
            columns={columns}
            rows={services ?? []}
            rowKey={(s) => s.id}
            loading={loading}
            onRowClick={() => navigate("/app-engineer/gitops")}
          />
        </div>

        <SidePanel title="GitOps sync">
          {(gitops ?? []).map((app) => (
            <div key={app.name} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{app.name}</div>
                <div className="text-xs text-muted-foreground">{timeAgo(app.last_sync)}</div>
              </div>
              <StatusBadge>{app.sync_status}</StatusBadge>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1"
            onClick={async () => {
              await Promise.all((gitops ?? []).map((a) => syncApp(a.name)));
              toast.success("Sync triggered for all apps");
              refetch();
            }}
          >
            Sync all
          </Button>
        </SidePanel>
      </div>
    </div>
  );
};

export default AppEngineerDashboard;
