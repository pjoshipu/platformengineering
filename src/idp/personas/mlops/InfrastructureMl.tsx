import { useState } from "react";
import { toast } from "sonner";
import { Cpu, Server, Radio, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PageHeader,
  MetricCard,
  MetricsRow,
  DataTable,
  StatusBadge,
  type Column,
} from "@/idp/components";
import { useMockQuery } from "@/idp/api/client";
import { getInfraNodes, getInfraMetrics, type InfraNode } from "./api";

const utilTone = (v: number) => (v >= 85 ? "danger" : v >= 65 ? "warning" : "success");

const InfrastructureMl = () => {
  const { data: nodes, loading } = useMockQuery(getInfraNodes, []);
  const { data: metrics } = useMockQuery(getInfraMetrics, []);
  const [type, setType] = useState("all");

  const rows = (nodes ?? []).filter((n) => type === "all" || n.type === type);

  const columns: Column<InfraNode>[] = [
    { key: "name", header: "Name", sortable: true, render: (n) => <span className="font-medium">{n.name}</span> },
    { key: "type", header: "Type", render: (n) => <StatusBadge tone="neutral">{n.type}</StatusBadge> },
    { key: "status", header: "Status", render: (n) => <StatusBadge>{n.status}</StatusBadge> },
    {
      key: "utilisation",
      header: "Utilisation",
      sortable: true,
      align: "right",
      render: (n) => <StatusBadge tone={utilTone(n.utilisation)}>{`${n.utilisation}%`}</StatusBadge>,
    },
    { key: "region", header: "Region" },
    { key: "age", header: "Age", sortable: true },
    {
      key: "actions",
      header: "Actions",
      render: (n) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => toast(`Metrics for ${n.name}`)}>Metrics</Button>
          <Button variant="ghost" size="sm" onClick={() => toast.success(`Draining ${n.name}`)}>Drain</Button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <Select value={type} onValueChange={setType}>
      <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All types</SelectItem>
        <SelectItem value="GPU node">GPU node</SelectItem>
        <SelectItem value="Training cluster">Training cluster</SelectItem>
        <SelectItem value="Serving endpoint">Serving endpoint</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div>
      <PageHeader
        title="Infrastructure (ML)"
        description="GPU nodes, training clusters, and serving endpoints backing your models."
      />

      <MetricsRow>
        <MetricCard label="GPU utilisation" value={metrics ? `${metrics.gpu_utilisation}%` : "—"} icon={Cpu} tone={metrics ? (metrics.gpu_utilisation >= 85 ? "poor" : metrics.gpu_utilisation >= 65 ? "warning" : "good") : "default"} />
        <MetricCard label="Active training nodes" value={metrics?.active_training_nodes ?? "—"} icon={Server} tone="highlight" />
        <MetricCard label="Serving endpoints" value={metrics?.serving_endpoints ?? "—"} icon={Radio} />
        <MetricCard label="Queue depth" value={metrics?.queue_depth ?? "—"} icon={ListOrdered} tone={metrics && metrics.queue_depth > 0 ? "warning" : "good"} />
      </MetricsRow>

      <div className="mt-8">
        <DataTable columns={columns} rows={rows} rowKey={(n) => n.id} loading={loading} toolbar={toolbar} />
      </div>
    </div>
  );
};

export default InfrastructureMl;
