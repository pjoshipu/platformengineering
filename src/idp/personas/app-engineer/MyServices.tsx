import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, DataTable, StatusBadge, type Column } from "@/idp/components";
import { useMockQuery, timeAgo } from "@/idp/api/client";
import { getServices, type Service } from "./api";

const MyServices = () => {
  const navigate = useNavigate();
  const { data: services, loading } = useMockQuery(getServices, []);
  const [env, setEnv] = useState("all");
  const [health, setHealth] = useState("all");

  const rows = (services ?? []).filter(
    (s) => (env === "all" || s.env === env) && (health === "all" || s.health === health)
  );

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
          <Button variant="ghost" size="sm" onClick={() => toast(`Scale ${s.name}`)}>Scale</Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex gap-2">
      <Select value={env} onValueChange={setEnv}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All environments</SelectItem>
          <SelectItem value="prod">Prod</SelectItem>
          <SelectItem value="staging">Staging</SelectItem>
          <SelectItem value="dev">Dev</SelectItem>
        </SelectContent>
      </Select>
      <Select value={health} onValueChange={setHealth}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All health</SelectItem>
          <SelectItem value="Healthy">Healthy</SelectItem>
          <SelectItem value="Degraded">Degraded</SelectItem>
          <SelectItem value="Progressing">Progressing</SelectItem>
          <SelectItem value="Missing">Missing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="My Services"
        description="All services you own across environments."
        actions={<Button onClick={() => navigate("/app-engineer/deploy")}>New Service Request</Button>}
      />
      <DataTable columns={columns} rows={rows} rowKey={(s) => s.id} loading={loading} toolbar={toolbar} />
    </div>
  );
};

export default MyServices;
